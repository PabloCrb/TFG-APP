require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");

app.use(express.json());

//--------------------------------------------MAIN------------------------------------------
async function AI_analyze(prompt) {
  const response = await axios.post(
    `${process.env.API_URL}:${process.env.LLAMA_PORT}/api/generate`,
    {
      model: "llama3",
      prompt: prompt,
      stream: false,
    },
  );

  return response.data.response;
}
//------------------------------------------------------------------------------------------

app.get("/AI/analyzeBudgets", async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.API_URL}:${process.env.DB_PORT}/AI/getUserBudgets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ userID: 4, cardID: 9 }),
      },
    );
    let data = await response.json();
    if (!data.ok) return res.status(200).json({ response: ai_response });
    else data = cleanBudgetData(data.data);

    const ai_response = await AI_analyze(
      `Eres un asesor financiero experto en finanzas personales.
        Analiza los siguientes presupuestos y transacciones del usuario.

        Tu objetivo es:
        1. Detectar si algún presupuesto está cerca de superarse o ya ha sido superado.
        2. Identificar patrones de gasto innecesario.
        3. Sugerir ajustes concretos en los presupuestos (no genéricos).
        4. Recomendar mejoras en hábitos de consumo.
        5. Priorizar recomendaciones prácticas y accionables.

        IMPORTANTE:
        - Responde en español claro.
        - Sé directo y estructurado.
        - Usa bullets.
        - Si detectas problemas graves, priorízalos.

        Datos del usuario:
        ${JSON.stringify(data, null, 2)}`,
    );

    return res.status(200).json({ response: ai_response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function cleanBudgetData(data) {
  return data.map((b) => ({
    budget_id: b.budget_id,
    label: b.label,
    amount: Number(b.amount),
    spent: Math.abs(Number(b.spent)),
    usage_percent: (b.spent / b.amount) * 100,
    period_type: b.period_type,
    start_date: b.start_date,
    transactions: JSON.parse(b.transactions || "[]").map((t) => ({
      transaction_id: t.transaction_id,
      description: t.description,
      amount: Math.abs(Number(t.amount)),
      date: t.date,
    })),
  }));
}

app.listen(4000, () => {
  console.log(`Microservicio IA corriendo en puerto ${process.env.PORT}`);
});
