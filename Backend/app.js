const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const e = require("express");
const cron = require("node-cron");

app.use(cors());
app.use(express.json());

const saltRounds = 10;

//------------------TEST-------------------
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "Backend funcionando" });
});

app.get("/api/testDB", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

app.get("/api/testToken", verifyToken, (req, res) => {
  res.json({ message: "Token válido", user: req.user });
});

//--------------GENERAL-----------------

// Función genérica para consultas
async function queryDB(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    return res.sendStatus(403);
  }

  const token = bearerHeader.split(" ")[1];

  jwt.verify(token, process.env.TOKEN_PASS, (err, authData) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = authData;
    next();
  });
}

async function checkUsersActivity() {
  const sql = `
    UPDATE users
    SET active = false
    WHERE last_login < DATE_SUB(NOW(), INTERVAL 1 MONTH);
  `;
  await queryDB(sql, []);
}

//-------------------------------------

//-------------------AUTH-------------------

async function userOrEmailExists(username, email) {
  const sqlCheck =
    "SELECT username, email FROM users WHERE username = ? OR email = ?";

  const existingUsers = await queryDB(sqlCheck, [username, email]);

  let foundUser = false;
  let foundEmail = false;

  existingUsers.forEach((u) => {
    if (u.username === username) foundUser = true;
    if (u.email === email) foundEmail = true;
  });

  return {
    exists: foundUser || foundEmail,
    username: foundUser,
    email: foundEmail,
  };
}

app.post("/auth/registerWithEmail", async (req, res) => {
  const { username, email, password } = req.body;

  const result = await userOrEmailExists(username, email);

  if (result.exists) {
    const message =
      result.username && result.email
        ? "El nombre de usuario y el email ya están en uso"
        : result.username
          ? "El nombre de usuario ya está en uso"
          : "El email ya está registrado";

    return res.status(400).json({ message });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const sqlInsert =
    "INSERT INTO users (username, email, password, active) VALUES (?, ?, ?, true)";

  await queryDB(sqlInsert, [username, email, hashedPassword]);

  res.status(201).json({ message: "Usuario registrado con éxito" });
});

app.post("/auth/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  const sql =
    "SELECT id, username, email, password FROM users WHERE username = ? OR email = ?";
  const results = await queryDB(sql, [usernameOrEmail, usernameOrEmail]);

  if (results.length === 0) {
    return res.status(400).json({ message: "Usuario no encontrado" });
  }

  const user = results[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Contraseña incorrecta" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    "ktFIUB3Gkv",
    {
      expiresIn: "1h",
    },
  );

  const returnValue = await updateLastLogin(user.id);

  if (!returnValue) {
    res.status(500).json({
      message: "Error al modificar el último inicio de sesión",
    });
  } else {
    res.status(200).json({
      message: "Login correcto",
      token: token,
    });
  }
});

async function updateLastLogin(userID) {
  const sql = "UPDATE users SET active = true, last_login = NOW() WHERE id = ?";
  const results = await queryDB(sql, [userID]);
  if (results.affectedRows === 1) return true;
  return false;
}

//------------------------------------------

//-------------------CARDS-------------------

app.post("/transactions/createCard", verifyToken, async (req, res) => {
  const { name, type, number, balance } = req.body;
  const userID = req.user.id;

  const sql =
    "INSERT INTO cards (user_id, number, name, type, balance) VALUES (?, ?, ?, ?, ?)";
  await queryDB(sql, [userID, number, name, type, balance]);
  res.status(200).json({ message: "Tarjeta creada con éxito" });
});

app.post("/transactions/getUserCards", verifyToken, async (req, res) => {
  const userID = req.user.id;

  const sql =
    "SELECT card_id, number, name, type, balance FROM cards WHERE user_id = ?";
  const cards = await queryDB(sql, [userID]);
  res.status(200).json({ cards });
});

//------------------------------------------

//-------------------TRANSACTIONS-------------------

app.post("/transactions/getTransactionTypes", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const isIncome = req.body.isIncome;

  const sql =
    "SELECT transaction_type_id, label FROM transaction_types WHERE (user_id = ? OR user_id = 0) AND isIncome = ?";
  const results = await queryDB(sql, [userID, isIncome]);

  res.json({ ok: true, data: results });
});

app.get("/transactions/getTransactionLabels", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const budgetID = req.query.budgetID;

  const sql = `
    SELECT tt.transaction_type_id, tt.label
    FROM transaction_types tt
    JOIN categories_budgets cb 
      ON tt.transaction_type_id = cb.transaction_type_id
    WHERE cb.budget_id = ?;
    `;
  const results = await queryDB(sql, [budgetID]);

  res.json({ ok: true, data: results });
});

app.post("/transactions/addTransaction", verifyToken, async (req, res) => {
  const { selectedCardID, transaction } = req.body;

  const userID = req.user.id;

  const sql =
    "INSERT INTO transactions (user_id, card_id, transaction_type_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)";
  await queryDB(sql, [
    userID,
    selectedCardID,
    transaction.transaction_type_id,
    transaction.amount,
    transaction.description,
    transaction.transaction_date,
  ]);
  res.status(200).json({ ok: true, message: "Transaccion añadida con éxito" });
});

app.post("/transactions/getTransactions", verifyToken, async (req, res) => {
  const selectedCardID = req.body.selectedCardID;
  const userID = req.user.id;

  const sql = `SELECT 
      t.transaction_id,
      t.card_id,
      t.transaction_type_id,
      tt.label AS type_label,
      t.amount,
      t.description,
      t.transaction_date,
      t.recurring_id
    FROM transactions t
    JOIN transaction_types tt 
      ON t.transaction_type_id = tt.transaction_type_id
    WHERE t.user_id = ? 
      AND t.card_id = ?
    ORDER BY t.transaction_date DESC;`;
  const transactions = await queryDB(sql, [userID, selectedCardID]);
  res.status(200).json({ ok: true, data: transactions });
});

app.delete("/transactions/deleteTransaction", verifyToken, async (req, res) => {
  const transaction = req.body.transaction;
  const userID = req.user.id;
  const sql =
    "DELETE FROM transactions where transaction_id = ? AND user_id = ?";
  const response = await queryDB(sql, [transaction.transaction_id, userID]);
  res.status(200).json({ ok: true, data: response });
});

app.post("/transactions/editTransaction", verifyToken, async (req, res) => {
  const transaction = req.body.transaction;
  const userID = req.user.id;

  const sql =
    "UPDATE transactions SET amount = ?, transaction_date = ?, description = ?, transaction_type_id = ? WHERE transaction_id = ? AND user_id = ?";
  const response = await queryDB(sql, [
    transaction.amount,
    transaction.transaction_date,
    transaction.description,
    transaction.transaction_type_id,
    transaction.transaction_id,
    userID,
  ]);
  res.status(200).json({ ok: true, data: response });
});

app.post("/transactions/updateBalance", verifyToken, async (req, res) => {
  const { amount, cardID } = req.body;
  const userID = req.user.id;

  const sql =
    "UPDATE cards SET balance = balance + ? WHERE card_id = ? AND user_id = ?";
  const response = await queryDB(sql, [amount, cardID, userID]);
  res.status(200).json({ ok: true, data: response });
});

app.post(
  "/transactions/createTransactionType",
  verifyToken,
  async (req, res) => {
    const { label, type } = req.body.data;
    const userID = req.user.id;

    const sql =
      "INSERT INTO transaction_types (user_id, label, isIncome) VALUES (?, ?, ?)";
    const response = await queryDB(sql, [userID, label, type]);
    res.status(200).json({ ok: true, data: response });
  },
);

//--------------------------------------------------

//-------------------RECURRENCIA--------------------

app.post(
  "/transactions/addRecurringTransaction",
  verifyToken,
  async (req, res) => {
    const rt = req.body.transaction;
    const userID = req.user.id;
    const endDate = rt.end_date || null;

    const sql = `INSERT INTO recurring_transactions 
      (user_id, card_id, amount, description, transaction_type_id, frequency_id, start_date, end_date)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
      `;
    const response = await queryDB(sql, [
      userID,
      rt.card_id,
      rt.amount,
      rt.description,
      rt.transaction_type_id,
      rt.frequency_id,
      rt.start_date,
      endDate,
    ]);
    res.status(200).json({ ok: true, data: response });
  },
);

app.post(
  "/transactions/editRecurringTransaction",
  verifyToken,
  async (req, res) => {
    const rt = req.body.transaction;
    const userID = req.user.id;
    const endDate = rt.end_date || null;

    const sql = `UPDATE recurring_transactions SET amount = ?, description = ?, transaction_type_id = ?, 
    frequency_id = ?, start_date = ?, end_date = ? WHERE rt_id = ? AND user_id = ? AND card_id = ?;
      `;
    const response = await queryDB(sql, [
      rt.amount,
      rt.description,
      rt.transaction_type_id,
      rt.frequency_id,
      rt.start_date,
      endDate,
      rt.rt_id,
      userID,
      rt.card_id,
    ]);
    res.status(200).json({ ok: true, data: response });
  },
);

app.delete(
  "/transactions/deleteRecurringTransaction",
  verifyToken,
  async (req, res) => {
    const rt = req.body.transaction;
    const userID = req.user.id;

    const sql = `DELETE FROM recurring_transactions WHERE rt_id = ? AND user_id = ?;
      `;
    const response = await queryDB(sql, [rt.rt_id, userID]);
    res.status(200).json({ ok: true, data: response });
  },
);

app.post(
  "/transactions/getRecurringUserTransactions",
  verifyToken,
  async (req, res) => {
    const userID = req.user.id;
    const cardID = req.body.cardID;

    const sql = `SELECT 
      rt.*,
      c.name AS card_name,
      f.label AS frequency_label,
      tt.label AS transaction_type_label
    FROM recurring_transactions rt
    JOIN cards c 
      ON rt.card_id = c.card_id
    JOIN frequencies f 
      ON rt.frequency_id = f.frequency_id
    JOIN transaction_types tt 
      ON rt.transaction_type_id = tt.transaction_type_id
    WHERE rt.user_id = ? 
      AND rt.card_id = ?
      AND rt.active = 1 ORDER BY rt.start_date DESC;
    `;
    const response = await queryDB(sql, [userID, cardID]);
    res.status(200).json({ ok: true, data: response });
  },
);

const generateRecurringTransactions = async () => {
  try {
    const recurringTransactions = await getRecurringTransactions();

    for (const rt of recurringTransactions) {
      if (!shouldExecute(rt)) continue;
      await addRecurringTransaction(rt);
      await updateBalance(rt.amount, rt.card_id, rt.user_id);
      await updateLastExecuted(rt.rt_id);
    }
  } catch (err) {
    console.error("Error en transacción recurrente:", err);
  }
};

async function getRecurringTransactions() {
  const sqlGetRT =
    "SELECT rt.*, f.interval_days_value FROM recurring_transactions rt JOIN frequencies f ON rt.frequency_id = f.frequency_id WHERE rt.active = true";

  return await queryDB(sqlGetRT, []);
}

function getNextExecutionDate(rt) {
  const start = normalizeDate(rt.start_date);
  const last = rt.last_executed ? normalizeDate(rt.last_executed) : null;

  const baseDate = last || start;

  const next = new Date(baseDate);
  next.setDate(next.getDate() + rt.interval_days_value);

  return next;
}

function shouldExecute(rt) {
  const today = normalizeDate(new Date());
  const start = normalizeDate(rt.start_date);
  const end = rt.end_date ? normalizeDate(rt.end_date) : null;
  const last = rt.last_executed ? normalizeDate(rt.last_executed) : null;

  if (today < start) return false;
  if (end && today > end) return false;
  if (last && last > today) return false;

  if (last && last.getTime() === today.getTime()) return false;

  const nextExecution = getNextExecutionDate(rt);
  return today >= nextExecution;
}

async function addRecurringTransaction(rt) {
  const sql = `
    INSERT INTO transactions 
    (user_id, card_id, transaction_type_id, amount, description, transaction_date, recurring_id)
    VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `;

  await queryDB(sql, [
    rt.user_id,
    rt.card_id,
    rt.transaction_type_id,
    rt.amount,
    rt.description,
    rt.rt_id,
  ]);
}

async function updateBalance(amount, card_id, user_id) {
  const sqlUpdateBalance = `
    UPDATE cards 
    SET balance = balance + ?
    WHERE card_id = ? AND user_id = ?
    `;
  await queryDB(sqlUpdateBalance, [amount, card_id, user_id]);
}

async function updateLastExecuted(rt_id) {
  const sqlUpdateLE = `
    UPDATE recurring_transactions
    SET last_executed = CURDATE()
    WHERE rt_id = ?
    `;

  await queryDB(sqlUpdateLE, [rt_id]);
}

//--------------------------------------------------

//-------------------PRESUPUESTOS--------------------

app.post("/budgets/getUserBudgets", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const cardID = req.body.cardID;

  const sql = `
      SELECT 
          b.budget_id,
          b.label,
          b.amount,
          b.period_type,
          b.start_date,
          ABS(COALESCE(SUM(t.amount), 0)) AS spent,
          JSON_ARRAYAGG(t.transaction_id) AS transaction_ids
      FROM budgets b
      LEFT JOIN categories_budgets cb ON cb.budget_id = b.budget_id
      LEFT JOIN transactions t 
          ON t.transaction_type_id = cb.transaction_type_id
          AND t.user_id = b.user_id
          AND t.card_id = b.card_id
          AND t.amount < 0
          AND t.transaction_date >= b.start_date
          AND t.transaction_date < (
              CASE b.period_type
                  WHEN 'diario'    THEN DATE_ADD(b.start_date, INTERVAL 1 DAY)
                  WHEN 'semanal'   THEN DATE_ADD(b.start_date, INTERVAL 1 WEEK)
                  WHEN 'quincenal' THEN DATE_ADD(b.start_date, INTERVAL 15 DAY)
                  WHEN 'mensual'   THEN DATE_ADD(b.start_date, INTERVAL 1 MONTH)
                  WHEN 'anual'     THEN DATE_ADD(b.start_date, INTERVAL 1 YEAR)
              END
          )
      WHERE b.user_id = ? AND b.card_id = ?
      GROUP BY b.budget_id

      UNION ALL

      SELECT
          NULL                                    AS budget_id,
          'Otros'                                 AS label,
          NULL                                    AS amount,
          NULL                                    AS period_type,
          NULL                                    AS start_date,
          ABS(COALESCE(SUM(t.amount), 0))         AS spent,
          JSON_ARRAYAGG(t.transaction_id)         AS transaction_ids
      FROM transactions t
      WHERE t.user_id = ?
        AND t.card_id = ?
        AND t.amount < 0
        AND t.transaction_type_id NOT IN (
            SELECT cb.transaction_type_id
            FROM categories_budgets cb
            INNER JOIN budgets b ON b.budget_id = cb.budget_id
            WHERE b.user_id = t.user_id
              AND b.card_id = t.card_id
        )
      `;

  const response = await queryDB(sql, [userID, cardID, userID, cardID]);

  res.status(200).json({ ok: true, data: response });
});

app.post("/budgets/createBudget", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const budget = req.body;

  try {
    const sqlBudget = `
      INSERT INTO budgets 
      (user_id, card_id, amount, label, period_type, start_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await queryDB(sqlBudget, [
      userID,
      budget.card_id,
      budget.amount,
      budget.label,
      budget.period_type,
      budget.start_date,
    ]);

    const budgetId = result.insertId;

    const sqlCategory = `
      INSERT INTO categories_budgets (budget_id, transaction_type_id)
      VALUES (?, ?)
    `;

    for (let categoryId of budget.transaction_ids) {
      await queryDB(sqlCategory, [budgetId, categoryId]);
    }

    res.status(200).json({ ok: true, budgetId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Error al crear presupuesto" });
  }
});

app.delete("/budgets/deleteBudget", verifyToken, async (req, res) => {
  const budgetID = req.body.budgetID;
  const userID = req.user.id;

  const sql = `DELETE FROM budgets where budget_id = ? AND user_id = ?`;
  const response = await queryDB(sql, [budgetID, userID]);
  res.status(200).json({ ok: true, data: response });
});

app.post("/budgets/editBudget", verifyToken, async (req, res) => {
  const budget = req.body.budget;
  const userID = req.user.id;

  const sql = `UPDATE budgets SET amount = ?, label = ?, period_type = ?, start_date = ? WHERE budget_id = ? AND user_id = ? AND card_id = ?`;
  const response = await queryDB(sql, [
    budget.amount,
    budget.label,
    budget.period_type,
    budget.start_date,
    budget.budget_id,
    userID,
    budget.card_id,
  ]);

  const sqlDelete = `DELETE FROM categories_budgets WHERE budget_id = ?`;
  const responseDelete = await queryDB(sqlDelete, [budget.budget_id]);

  for (let transaction_type_id of budget.transaction_ids) {
    const sqlInsert = `INSERT INTO categories_budgets (budget_id, transaction_type_id) VALUES (?, ?)`;
    const responseInsert = await queryDB(sqlInsert, [
      budget.budget_id,
      transaction_type_id,
    ]);
  }
  res.status(200).json({ ok: true, data: response });
});

app.post("/budgets/getTransactionsForBudget", verifyToken, async (req, res) => {
  const transaction_ids = req.body.transaction_ids;

  if (!transaction_ids || transaction_ids.length === 0) {
    return res.status(200).json({ ok: true, data: [] });
  }

  const sql = `
    SELECT 
      t.transaction_id,
      t.card_id,
      t.transaction_type_id,
      tt.label AS type_label,
      t.amount,
      t.description,
      t.transaction_date
    FROM transactions t
    JOIN transaction_types tt 
      ON t.transaction_type_id = tt.transaction_type_id
    WHERE t.transaction_id IN (?)
    ORDER BY t.transaction_date DESC;
  `;

  const transactions = await queryDB(sql, [transaction_ids]);

  res.status(200).json({ ok: true, data: transactions });
});

//--------------------------------------------------

//---------------------ENDPOINTS PARA IA------------

app.post("/budgets/getUserBudgets", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const cardID = req.body.cardID;

  const sql = `
    SELECT 
  `;

  const response = await queryDB(sql, [userID, cardID, userID, cardID]);

  res.status(200).json({ ok: true, data: response });
});

//--------------------------------------------------

cron.schedule("0 2 * * *", () => {
  console.log(
    "Comprobación de transacciones recurrentes y actividad de usuarios",
  );
  checkUsersActivity();
  generateRecurringTransactions();
});

module.exports = app;
