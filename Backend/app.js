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
  const internalKey = req.headers["x-internal-key"];

  if (internalKey) {
    if (internalKey === process.env.INTERNAL_API_KEY) {
      req.isInternal = true;
      return next();
    } else {
      return res.status(403).json({ error: "Invalid internal token" });
    }
  }

  if (bearerHeader) {
    const token = bearerHeader.split(" ")[1];

    jwt.verify(token, process.env.TOKEN_PASS, (err, authData) => {
      if (err) return res.sendStatus(403);

      req.user = authData;
      req.isInternal = false;
      next();
    });

    return;
  }

  return res.status(401).json({ error: "No authentication provided" });
}

async function checkUsersActivity() {
  const sql = `
    UPDATE users
    SET active = false
    WHERE last_login < DATE_SUB(NOW(), INTERVAL 1 MONTH);
  `;
  await queryDB(sql, []);
}

app.get("/getActiveUsers", verifyToken, async (req, res) => {
  const sql = "SELECT id FROM users WHERE active = true";
  const results = await queryDB(sql, []);

  res.status(200).json({
    ok: true,
    data: results,
  });
});

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
    return res
      .status(400)
      .json({ message: "Usuario o contraseña incorrectos" });
  }

  const user = results[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res
      .status(400)
      .json({ message: "Usuario o contraseña incorrectos" });
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
  res.status(200).json({ message: "Cuenta creada con éxito" });
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

app.get(
  "/transactions/getAllTransactionTypes",
  verifyToken,
  async (req, res) => {
    const userID = req.user.id;

    const sql =
      "SELECT transaction_type_id, label FROM transaction_types WHERE (user_id = ? OR user_id = 0)";
    const results = await queryDB(sql, [userID]);

    res.json({ ok: true, data: results });
  },
);

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

  try {
    const sql =
      "INSERT INTO transactions (user_id, card_id, transaction_type_id, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)";

    const results = await queryDB(sql, [
      userID,
      selectedCardID,
      transaction.transaction_type_id,
      transaction.amount,
      transaction.description,
      transaction.transaction_date,
    ]);

    const transactionId = results.insertId;

    await assignTransactionToBudgets(transactionId, userID);

    res.status(200).json({
      ok: true,
      message: "Transacción añadida con éxito",
      transactionId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Error al añadir transacción" });
  }
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
  try {
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

    if (response.affectedRows === 0)
      res.status(500).json({ ok: false, data: JSON.stringify(error) });

    const sqlDelete = `DELETE FROM budget_transactions WHERE transaction_id = ?`;
    const responseDel = await queryDB(sqlDelete, [transaction.transaction_id]);

    if (responseDel.affectedRows === 0)
      res.status(500).json({ ok: false, data: JSON.stringify(error) });

    await assignTransactionToBudgets(transaction.transaction_id, userID);
    res.status(200).json({ ok: true, data: response });
  } catch (error) {
    res.status(500).json({ ok: false, data: JSON.stringify(error) });
  }
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
    "SELECT u.id as user_id, rt.*, f.interval_days_value FROM recurring_transactions rt JOIN frequencies f ON rt.frequency_id = f.frequency_id JOIN users u ON rt.user_id = u.id WHERE rt.active = true AND u.active = true";

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
  const twoDaysBefore = new Date(nextExecution);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  if (today.getTime() === twoDaysBefore.getTime()) {
    buildRecurringExpenseNotification(rt);
    createNotification();
  }

  return today >= nextExecution;
}

function buildRecurringExpenseNotification(rt) {
  console.log(JSON.stringify(rt));
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

async function insertBudgetTransactions(budgetId) {
  try {
    const sql = `
        INSERT INTO budget_transactions (budget_id, transaction_id, assigned_at)
      SELECT 
          b.budget_id,
          t.transaction_id,
          NOW()
      FROM budgets b
      LEFT JOIN categories_budgets cb 
          ON cb.budget_id = b.budget_id
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
      WHERE b.budget_id = ?
      AND t.transaction_id IS NOT NULL;
    `;
    const response = await queryDB(sql, [budgetId]);
    return response.affectedRows;
  } catch (error) {
    return error;
  }
}

async function insertCategoriesBudgets(transaction_ids, budgetId) {
  try {
    const values = transaction_ids.map((id) => [budgetId, id]);

    await queryDB(
      `
        INSERT INTO categories_budgets (budget_id, transaction_type_id)
        VALUES ?
      `,
      [values],
    );
    return response.affectedRows;
  } catch (error) {
    return error;
  }
}

async function assignTransactionToBudgets(transactionId, userId) {
  const sql = `
    INSERT INTO budget_transactions (budget_id, transaction_id, assigned_at)
    SELECT 
        b.budget_id,
        t.transaction_id,
        NOW()
    FROM transactions t
    JOIN budgets b 
        ON b.user_id = t.user_id
    JOIN categories_budgets cb 
        ON cb.budget_id = b.budget_id
    WHERE t.transaction_id = ?
      AND t.user_id = ?
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
    ON DUPLICATE KEY UPDATE assigned_at = assigned_at;
  `;

  await queryDB(sql, [transactionId, userId]);
}

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
      LEFT JOIN budget_transactions bt 
          ON bt.budget_id = b.budget_id
      LEFT JOIN transactions t 
          ON t.transaction_id = bt.transaction_id
      WHERE b.user_id = ? 
        AND b.card_id = ?
      GROUP BY b.budget_id;
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

    const resCB = await insertCategoriesBudgets(
      budget.transaction_ids,
      budgetId,
    );
    if (resCB.affectedRows === 0) {
      return res
        .status(500)
        .json({ ok: false, data: "Fallo al añadir las categorías" });
    }

    const resBT = await insertBudgetTransactions(budgetId);
    if (resBT.affectedRows === 0) {
      return res
        .status(500)
        .json({ ok: false, data: "Fallo al calcular las transacciones" });
    }
    return res.status(200).json({ ok: true, budgetId });
  } catch (error) {
    res.status(500).json({ ok: false, data: "Error al crear presupuesto" });
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

  try {
    const sql = `
      UPDATE budgets 
      SET amount = ?, label = ?, period_type = ?, start_date = ? 
      WHERE budget_id = ? AND user_id = ? AND card_id = ?
    `;

    await queryDB(sql, [
      budget.amount,
      budget.label,
      budget.period_type,
      budget.start_date,
      budget.budget_id,
      userID,
      budget.card_id,
    ]);

    await queryDB(`DELETE FROM categories_budgets WHERE budget_id = ?`, [
      budget.budget_id,
    ]);

    for (let id of budget.transaction_ids) {
      await queryDB(
        `INSERT INTO categories_budgets (budget_id, transaction_type_id) VALUES (?, ?)`,
        [budget.budget_id, id],
      );
    }

    await queryDB(`DELETE FROM budget_transactions WHERE budget_id = ?`, [
      budget.budget_id,
    ]);

    await insertBudgetTransactions(budget.budget_id);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false });
  }
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

//-----------------------DASHBOARD------------------

app.post("/dashboard/getSummary", verifyToken, async (req, res) => {
  try {
    const userID = req.user.id;
    const cardID = req.body.cardID;

    const sql = `
      SELECT 
          DATE_FORMAT(t.transaction_date, '%Y-%m') AS month,
          
          SUM(CASE 
              WHEN t.amount > 0 THEN t.amount 
              ELSE 0 
          END) AS total_income,

          SUM(CASE 
              WHEN t.amount < 0 THEN ABS(t.amount) 
              ELSE 0 
          END) AS total_expenses,

          SUM(t.amount) AS balance,

          (
              SELECT SUM(b.amount)
              FROM budgets b
              WHERE b.user_id = t.user_id
                AND b.card_id = t.card_id
          ) AS total_budget

      FROM transactions t
      WHERE t.user_id = ?
      AND t.card_id = ?

      GROUP BY month
      ORDER BY month;
  `;
    const response = await queryDB(sql, [userID, cardID]);
    res.status(200).json({ ok: true, data: response });
  } catch (error) {
    res.status(500).json({ ok: false, data: JSON.stringify(error) });
  }
});

//--------------------------------------------------

//---------------------NOTIFICACIONES---------------
async function createNotification(userID, notif) {
  const id = crypto.randomUUID();

  await queryDB(
    `INSERT INTO notifications (id, user_id, type, title, message)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userID, notif.type, notif.title, notif.message],
  );
}

app.get("/notifications/getNotifications", verifyToken, async (req, res) => {
  const userID = req.user.id;

  const response = await queryDB(
    "SELECT * FROM notifications WHERE user_id = ? AND isRead = 0 ORDER BY created_at DESC",
    [userID],
  );

  res.status(200).json({ ok: true, data: response });
});

app.post("/notifications/markAsRead", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const { notificationId } = req.body;

  const sql = `UPDATE notifications SET isRead = 1 WHERE id = ? AND user_id = ?`;
  const response = await queryDB(sql, [notificationId, userID]);

  res.status(200).json({ ok: true, data: response });
});

//---------------------ENDPOINTS PARA IA------------

app.get("/getActiveUserBudgets", verifyToken, async (req, res) => {
  const sql = `
      SELECT 
          b.budget_id,
          b.label,
          b.amount,
          b.start_date,
          
          t.transaction_id,
          t.amount AS transaction_amount,
          t.transaction_date AS transaction_date,
          
          tt.label AS transaction_type

      FROM budgets b

      LEFT JOIN users u
          ON b.user_id = u.id

      LEFT JOIN categories_budgets c
          ON b.budget_id = c.budget_id

      LEFT JOIN transactions t
          ON t.transaction_type_id = c.transaction_type_id

      LEFT JOIN transaction_types tt
          ON tt.transaction_type_id = t.transaction_type_id

      WHERE u.active = true;
      `;

  const response = await queryDB(sql, []);
  res.status(200).json({ ok: true, data: response });
});

app.post("/AI/getUserBudgets", verifyToken, async (req, res) => {
  const userID = req.body.userID;
  const cardID = req.body.cardID;

  const sql = `
      SELECT 
          b.budget_id,
          b.label,
          b.amount,
          b.period_type,
          b.start_date,
          ABS(COALESCE(SUM(t.amount), 0)) AS spent,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'transaction_id', t.transaction_id,
              'description', t.description,
              'amount', t.amount,
              'date', t.transaction_date
            )
          ) AS transactions
      FROM budgets b
      LEFT JOIN budget_transactions bt 
          ON bt.budget_id = b.budget_id
      LEFT JOIN transactions t 
          ON t.transaction_id = bt.transaction_id
      WHERE b.user_id = ? 
        AND b.card_id = ?
      GROUP BY b.budget_id;
      `;

  const response = await queryDB(sql, [userID, cardID, userID, cardID]);

  res.status(200).json({ ok: true, data: response });
});

async function getUserAndCardExpenses(userID, cardID) {
  try {
    const sql = `SELECT 
          tt.label AS category,
          SUM(ABS(t.amount)) AS total_amount
      FROM transactions t
      INNER JOIN transaction_types tt 
          ON t.transaction_type_id = tt.transaction_type_id
      WHERE tt.isIncome = false AND t.user_id = ? AND t.card_id = ?
      GROUP BY tt.transaction_type_id, tt.label
      ORDER BY total_amount ASC;
    `;

    const response = await queryDB(sql, [userID, cardID]);

    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, data: JSON.stringify(error) };
  }
}

async function getUserAndCardTransactions(userID, cardID) {
  try {
    const sql = `
      SELECT 
          DATE_FORMAT(t.transaction_date, '%Y-%m') AS month,
          tt.label AS category,
          tt.isIncome,
          SUM(t.amount) AS total_amount
      FROM transactions t
      INNER JOIN transaction_types tt 
          ON t.transaction_type_id = tt.transaction_type_id
      WHERE t.user_id = ? 
        AND t.card_id = ?
        AND t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY 
          DATE_FORMAT(t.transaction_date, '%Y-%m'),
          tt.label,
          tt.isIncome 
      ORDER BY month desc, total_amount desc;
        `;

    const response = await queryDB(sql, [userID, cardID]);
    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, data: JSON.stringify(error) };
  }
}

app.post("/AI/getUserAndCardExpenses", verifyToken, async (req, res) => {
  const userID = req.body.userID;
  const cardID = req.body.cardID;

  const response = await getUserAndCardExpenses(userID, cardID);
  if (!response.ok)
    return res.status(500).json({ ok: false, data: response.data });
  return res.status(200).json({ ok: true, data: response.data });
});

app.post("/AI/getUserAndCardTransactions", verifyToken, async (req, res) => {
  const userID = req.body.userID;
  const cardID = req.body.cardID;

  const response = await getUserAndCardTransactions(userID, cardID);
  if (!response.ok)
    return res.status(500).json({ ok: false, data: response.data });
  return res.status(200).json({ ok: true, data: response.data });
});

app.post(
  "/AI/getUserAndCardRecurringExpenses",
  verifyToken,
  async (req, res) => {
    const userID = req.body.userID;
    const cardID = req.body.cardID;

    const sql = `
      SELECT ABS(rt.amount) as amount, rt.description, f.label, rt.start_date, rt.end_date, rt.last_executed 
      FROM recurring_transactions rt LEFT JOIN frequencies f ON rt.frequency_id = f.frequency_id
      LEFT JOIN users u ON rt.user_id = u.id
      WHERE u.active = true AND rt.user_id = ? AND rt.card_id = ? AND (rt.end_date < NOW() or rt.end_date is null) AND rt.amount < 0 AND rt.active = true AND u.active = true 
    `;

    const response = await queryDB(sql, [userID, cardID]);

    return res.status(200).json({ ok: true, data: response });
  },
);

async function getUserAndCardBudgets(userID, cardID) {
  try {
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
      LEFT JOIN budget_transactions bt 
          ON bt.budget_id = b.budget_id
      LEFT JOIN transactions t 
          ON t.transaction_id = bt.transaction_id
      WHERE b.user_id = ? 
        AND b.card_id = ?
      GROUP BY b.budget_id;
    `;

    const response = await queryDB(sql, [userID, cardID]);

    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, data: JSON.stringify(error) };
  }
}

app.post("/AI/getUserAndCardBudgets", verifyToken, async (req, res) => {
  const userID = req.body.userID;
  const cardID = req.body.cardID;

  const response = await getUserAndCardBudgets(userID, cardID);
  if (!response.ok)
    return res.status(500).json({ ok: false, data: response.data });
  return res.status(200).json({ ok: true, data: response.data });
});

app.post("/AI/generateAIReport", verifyToken, async (req, res) => {
  const userID = req.user.id;
  const categoriesIDs = req.body.categoriesIDs;
  const selectedCard = req.body.selectedCard;

  const response = await fetch(
    `${process.env.API_URL}:${process.env.AI_PORT}/AI/generateAIReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        userID: userID,
        categoriesIDs: categoriesIDs,
        selectedCard: selectedCard,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) return res.status(500).json({ ok: false, data: data.data });

  res.status(200).json({ ok: true, data: data.data });
});

//--------------------------------------------------

cron.schedule("0 10 * * *", () => {
  console.log(
    "Comprobación de transacciones recurrentes y actividad de usuarios",
  );
  checkUsersActivity();
  generateRecurringTransactions();
});

module.exports = app;
