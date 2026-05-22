require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");

app.use(express.json());

//--------------------------------------------MAIN------------------------------------------
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

async function AI_analyze(prompt) {
  const response = await axios.post(
    `${process.env.API_URL}:${process.env.LLAMA_PORT}/api/generate`,
    {
      model: "llama3",
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 1024,
      },
    },
  );

  return response.data.response;
}
//------------------------------------------------------------------------------------------

app.get("/AI/generateAlerts", verifyToken, async (req, res) => {
  const userID = req.body.userID;
  const expenses = req.body.expenses;

  const ai_response = await AI_analyze(
    `Analiza los siguientes datos y elabora una lista de alertas financieras para el usuario.

    INSTRUCCIONES:
      - Texto en ESPAÑOL CASTELLANO
      - Genera entre 1 a 3 alertas claras y concisas
      - Cada alerta debe describir claramente el problema detectado y su posible impacto
      - Prioriza alertas relacionadas con gastos excesivos, patrones de consumo preocupantes o riesgos financieros evidentes
      - Si no se detectan problemas significativos, genera una alerta positiva destacando la buena salud financiera
      - No añadas explicaciones ni recomendaciones, solo las alertas concretas

      FORMATO DE SALIDA:
      - Devuelve SOLO un array de objetos con la siguiente estructura:
        [
          {
            "message": "Descripción clara del problema o situación detectada",
            "impact": "low|medium|high"
          },
          ...
        ]

    Datos del usuario:
    ${JSON.stringify(expenses, null, 2)}`,
  );

  console.log("AI response:", ai_response);

  return res.status(200).json({ ok: true, data: ai_response });
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

const dataFetchers = {
  gastos: getExpenses,
  gastos_recurrentes: getRecurringExpenses,
  transacciones: getTransactions,
  presupuestos: getBudgets,
};
const tasks = [
  {
    ID: "gastos",
    task: "Realizar un análisis de los gastos del usuario.",
    instructions: `
      - Responde SOLO con el JSON. Sin explicaciones ni texto adicional.

      - mainInsights: exactamente 3-4 frases con esta estructura obligatoria:
        "[Categoría] representa el [X]% del gasto total ([Y]€), lo que [consecuencia concreta]"
        Ejemplo: "Restaurantes representa el 18% del gasto (142€), superando el gasto en Salud y Farmacia combinados."

      - alerts: exactamente 2-3, SOLO si se cumple alguna condición real:
        * Categoría prescindible > 15% del total
        * Suma de suscripciones > 50€/mes
        * Gasto en ocio > gasto en ahorro o salud
        * Ninguna categoría de ahorro presente
        Formato: { message: "problema + cifra concreta + por qué importa", impact: "low|medium|high" }

      - recommendations: exactamente 2-3, específicas y con cifras:
        * En lugar de "reduce el ocio" → "Reducir restaurantes un 30% liberaría ~[X]€/mes"
        * En lugar de "ahorra más" → "Destinar el [X]% de prescindibles al ahorro sumaría ~[Y]€/año"
    `,
    outputSchema: {
      summary: {
        status: "ok|warning|danger",
        mainInsights: [""],
      },
      categories: [{ name: "", amount: 0 }],
      alerts: [{ message: "", impact: "low|medium|high" }],
      recommendations: [{ message: "", impact: "low|medium|high" }],
    },
    additional: `
      PROCESO DE ANÁLISIS (síguelo internamente antes de responder):
      1. Clasifica cada categoría:
        - ESENCIAL: Alquiler, Supermercado, Luz, Agua, Gas, Internet, Transporte
        - SEMI-ESENCIAL: Salud, Farmacia, Educación, Seguros
        - PRESCINDIBLE: Restaurantes, Ocio, Cine, Viajes, Ropa, Electrónica
      2. Suma el total PRESCINDIBLE y calcula su % sobre el total
      3. Detecta si alguna categoría ESENCIAL supera el 40% del total
      4. Detecta si el total PRESCINDIBLE supera el 25% del total
      5. Busca desequilibrios: ¿hay categorías prescindibles que superen a semi-esenciales?

      CRITERIOS DE STATUS:
      - "ok": prescindibles < 20% Y ninguna esencial > 45%
      - "warning": prescindibles entre 20%-35% O alguna esencial entre 40%-50%
      - "danger": prescindibles > 35% O alguna esencial > 50% del total

      CRITERIOS PARA INSIGHTS (evita lo obvio):
      - NO digas "gastas mucho en alquiler" si es < 35% (es normal)
      - SÍ señala si una categoría PRESCINDIBLE supera a una ESENCIAL
      - SÍ señala si la suma de pequeños gastos recurrentes (Spotify, Netflix, etc.) es significativa
      - SÍ compara proporciones: "X representa el Y% del total"
      - Incluye siempre el importe en € y el % en cada insight
    `,
  },
  {
    ID: "gastos_recurrentes",
    task: "Realizar un análisis de los gastos recurrentes del usuario.",
    instructions: `
      - Analiza los gastos recurrentes como compromisos financieros fijos.

      - Proceso interno:
        1. Identifica todos los pagos recurrentes
        2. Agrúpalos por tipo (streaming, vivienda, servicios, etc.)
        3. Calcula:
          - total mensual
          - porcentaje sobre gasto total
        4. Detecta:
          - acumulación de servicios similares
          - servicios de bajo uso (si es inferible)
          - dependencia excesiva de gastos fijos

      - Evalúa sostenibilidad:
        - Bajo (<30%) → saludable
        - Medio (30-60%) → riesgo moderado
        - Alto (>60%) → rigidez financiera peligrosa

      - Identifica:
        - categorías dominantes
        - redundancias
        - posibles optimizaciones

      - alerts:
        - enfócate en:
          * rigidez financiera
          * gasto innecesario acumulado
          * duplicidad de servicios

      - recommendations:
        - prioriza:
          * reducción inmediata
          * consolidación de servicios
          * eliminación de redundancias
      `,
    outputSchema: {
      summary: {
        status: "ok|warning|danger",
        totalMonthlyRecurring: 0,
        recurringPercentage: 0,
        mainInsights: [""],
      },
      categories: [{ name: "", amount: 0, percentage: 0 }],
      alerts: [{ message: "", impact: "low|medium|high" }],
      recommendations: [{ message: "", impact: "low|medium|high" }],
    },
    additional: `
    - summary.status debe ser:
      * "ok" si los gastos recurrentes están controlados (<30% del total)
      * "warning" si son moderados (30% - 60%)
      * "danger" si son altos (>60%)
    - recurringPercentage = (gastos recurrentes / total gastos) * 100
    - Los porcentajes de categories deben sumar aproximadamente 100%
    - mainInsights debe contener entre 2 y 4 conclusiones claras
    - No inventes datos si no existen
  `,
  },
  {
    ID: "transacciones",
    task: "Realizar una predicción financiera completa para el mes actual.",
    instructions: `
      - Predice el estado financiero al FINAL del MES ACTUAL usando datos históricos del usuario.

      PRINCIPIO CLAVE (MUY IMPORTANTE)
      - El gasto NO se distribuye de forma uniforme
      - La mayoría del gasto se concentra en pocas categorías
      - Solo 20–30% de categorías deben cambiar significativamente

      REGLAS DE PREDICCIÓN
      1. CLASIFICA LAS CATEGORÍAS:
        - RECURRRENTES FIJAS:
          (alquiler, nómina, seguros, internet, suscripciones)
          → forecast = current (NO cambiar)

        - VARIABLES FRECUENTES:
          (supermercado, gasolina, transporte)
          → ajuste moderado basado en histórico

        - VARIABLES DISCRECIONALES:
          (restaurantes, ocio, compras, viajes, electrónica)
          → principal foco de predicción

      2. REGLA DE CONCENTRACIÓN (OBLIGATORIA)
      - Identifica TOP 3–5 categorías por importe actual
      - Estas deben absorber la mayoría del ajuste del forecast
      - El resto de categorías:
        → mantener current o cambios muy pequeños (<10%)

      3. AJUSTE DE FORECAST
      - Solo aumentar significativamente categorías:
        → restaurantes
        → compras
        → ocio
        → viajes
        → supermercado (moderado)

      - NO aumentar todas las categorías a la vez
      - Si una categoría ya es baja, NO inflarla artificialmente

      4. INGRESOS
      - ingresos estables (nómina, etc.) → mantener
      - variables (bonus, extras) → proyectar con base histórica

      OUTPUT OBLIGATORIO
      - currentMonthForecast:
        - income: [{name, current, forecast}]
        - expenses: [{name, current, forecast}]

      - totals:
        - income
        - expenses
        - balance

      INSIGHTS
      - 2 a 4 insights
      - Deben identificar:
        - TOP categorías que dominan el gasto
        - cambios relevantes vs histórico
        - riesgo financiero si existe
      `,
    outputSchema: {
      prediction: {
        currentMonthForecast: {
          income: [
            {
              name: "",
              current: 0,
              forecast: 0,
            },
          ],
          expenses: [
            {
              name: "",
              current: 0,
              forecast: 0,
            },
          ],
        },
        totals: {
          income: 0,
          expenses: 0,
          balance: 0,
        },
      },
      insights: [""],
    },
    additional: `
      - forecast = estimación a final de mes
      - SOLO usar categorías del mes actual
      - NO inventar categorías nuevas
      - Si una categoría no tiene evolución clara, forecast = current
      - Separar claramente income y expenses
      - expenses son positivos en el resultado final (no negativos)
      - No devolver arrays vacíos si hay datos suficientes
      `,
  },
  {
    ID: "transacciones",
    task: "Realizar una predicción de gastos para los próximos 6 meses.",
    instructions: `
      - Genera una predicción de gasto para los próximos 6 meses.

      - Proceso interno:
        1. Analiza histórico completo
        2. Detecta:
          - tendencia general (creciente, estable, decreciente)
          - estacionalidad
          - gastos recurrentes
        3. Modela cada mes:
          - base = promedio reciente
          - ajusta por:
            * estacionalidad
            * tendencia
            * eventos esperables

      - Reglas:
        - las variaciones entre meses deben ser coherentes
        - evita cambios bruscos sin justificación

      - insights:
        - 2 a 4
        - deben explicar:
          * tendencia global
          * meses críticos
          * factores clave del cambio
  `,
    outputSchema: {
      prediction: [
        {
          monthNumber: 0,
          predictedAmount: 0,
        },
      ],
      insights: [""],
    },
    additional: `
    - prediction DEBE contener exactamente 6 elementos (uno por cada mes futuro)
    - Los meses deben estar en orden cronológico a partir del mes actual
    - No repetir meses
    - predictedAmount debe ser un número realista basado en el histórico
    - insights debe contener entre 2 y 4 conclusiones claras
    - No devolver arrays vacíos
  `,
  },
  {
    ID: "presupuestos",
    task: "Generar sugerencias accionables para optimizar los presupuestos del usuario.",
    instructions: `
      - Analiza los presupuestos del usuario y su uso real.

      IMPORTANTE:
      - Responde SOLO con JSON válido
      - Sin texto adicional
      - Español castellano
      - No añadir campos extra

      OBJETIVO
      - Optimizar el uso del dinero
      - Reducir gasto innecesario
      - Reasignar presupuesto a categorías importantes

      CLASIFICACIÓN OBLIGATORIA
      Para cada presupuesto, clasificar en:

      - CRÍTICO:
        gasto >= 90% del límite

      - AJUSTADO:
        gasto entre 70% y 90%

      - INFRAUTILIZADO:
        gasto < 50%

      REGLAS DE DECISIÓN

      1. PRESUPUESTOS CRÍTICOS:
        - Prioridad ALTA
        - Sugerir:
          - reducir gasto o aumentar presupuesto
          - identificar si es categoría esencial o no

      2. PRESUPUESTOS AJUSTADOS:
        - Prioridad MEDIA
        - Optimización ligera

      3. INFRAUTILIZADOS:
        - Prioridad BAJA
        - Sugerir reducción o redistribución

      REGLA DE IMPORTANCIA
      Clasificar categorías:

      - ESENCIALES:
        vivienda, alimentación, transporte, suministros

      - NO ESENCIALES:
        ocio, compras, restaurantes, suscripciones

      Reglas:
      - NUNCA reducir presupuestos esenciales si ya están ajustados
      - PRIORIZAR reducción en no esenciales

      CONSOLIDACIÓN
      - Detectar presupuestos similares (ej: ocio + restaurantes)
      - Sugerir fusión si tiene sentido

      PRIORIZACIÓN FINAL
      - Máximo 5 sugerencias
      - Ordenadas por impacto económico

      Cada sugerencia debe incluir:
      - categoría afectada
      - acción concreta
      - impacto estimado (alto, medio, bajo)

      INSIGHTS
      - 2 a 4 insights
      - explicar:
        - distribución del presupuesto
        - riesgos
        - oportunidades de mejora
      `,
    outputSchema: {
      suggestions: [
        {
          category: "",
          action: "",
          impact: "alto | medio | bajo",
        },
      ],
      insights: [""],
    },
  },
];

function getRequiredData(categoriesIDs) {
  return [...new Set(categoriesIDs.map((id) => tasks[id].ID))];
}
async function getUserTypeReportData(dataType, userID, selectedCard) {
  const fetcher = dataFetchers[dataType];

  if (!fetcher) {
    throw new Error(`Tipo de dato no soportado: ${dataType}`);
  }

  return await fetcher(userID, selectedCard);
}
async function getUserData(requiredData, userID, selectedCard) {
  const dataResults = await Promise.all(
    requiredData.map(async (dataType) => {
      const data = await getUserTypeReportData(dataType, userID, selectedCard);
      return { type: dataType, data };
    }),
  );

  return Object.fromEntries(dataResults.map((d) => [d.type, d.data]));
}

function buildPrompt(userData, task) {
  return `
    Eres un asistente financiero experto en análisis de datos personales.

    Tu objetivo es generar EXACTAMENTE un JSON con el formato indicado.

    REGLAS IMPORTANTES:
    - Texto en ESPAÑOL CASTELLANO
    - Devuelve SOLO JSON
    - NO expliques nada
    - NO uses markdown
    - Respeta EXACTAMENTE la estructura pedida
    - Responde únicamente con JSON válido.
    - El resultado debe poder pasarse directamente a JSON.parse sin errores.
    - En caso de no disponer de suficientes datos, devuelve el JSON vacío

    TAREA:
    ${task.task}

    INSTRUCCIONES:
    ${task.instructions}

    FORMATO JSON DE SALIDA:
    ${JSON.stringify(task.outputSchema)}

    CUESTIONES ADICIONALES:
    ${JSON.stringify(task.additional)}

    DATOS:
    ${JSON.stringify(userData)}
    `;
}

function fixJsonBrackets(str) {
  const open = (str.match(/{/g) || []).length;
  const close = (str.match(/}/g) || []).length;

  if (open > close) {
    str += "}".repeat(open - close);
  }

  return str;
}

function extractJSON(response) {
  if (typeof response === "object") return response;

  const cleaned = response
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

  const fixed = fixJsonBrackets(cleaned);
  try {
    return JSON.parse(fixed);
  } catch (e) {
    console.error("Failed to parse AI response:", fixed);
    return null;
  }
}

async function generateReports(categoriesIDs, userID, selectedCard) {
  const requiredData = getRequiredData(categoriesIDs);
  const userData = await getUserData(requiredData, userID, selectedCard);

  const analysisResults = await Promise.all(
    categoriesIDs.map(async (ID) => {
      const task = tasks[ID];
      const taskData = { [task.ID]: userData[task.ID] };
      const prompt = buildPrompt(taskData, task);
      const aiResponse = await AI_analyze(prompt);
      const data = extractJSON(aiResponse);

      return {
        type: ID,
        data,
        error:
          data === null ? `Failed to parse response for category: ${ID}` : null,
      };
    }),
  );

  return analysisResults;
}

app.post("/AI/generateAIReport", verifyToken, async (req, res) => {
  try {
    const { userID, categoriesIDs, selectedCard } = req.body;

    const reportsArray = await generateReports(
      categoriesIDs,
      userID,
      selectedCard,
    );

    return res.status(200).json({
      ok: true,
      data: reportsArray,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});
//------------------------------OBTENCIÓN DATOS PARA REPORTE--------------

async function getExpenses(userID, cardID) {
  try {
    const response = await fetch(
      `${process.env.API_URL}:${process.env.DB_PORT}/AI/getUserAndCardExpenses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ userID, cardID }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.data || "Error obteniendo transacciones");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getTransactions:", error);
    throw error;
  }
}

async function getRecurringExpenses(userID, cardID) {
  try {
    const response = await fetch(
      `${process.env.API_URL}:${process.env.DB_PORT}/AI/getUserAndCardRecurringExpenses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ userID, cardID }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.data || "Error obteniendo transacciones");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getRecurringExpenses:", error);
    throw error;
  }
}

async function getTransactions(userID, cardID) {
  try {
    const response = await fetch(
      `${process.env.API_URL}:${process.env.DB_PORT}/AI/getUserAndCardTransactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ userID, cardID }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.data || "Error obteniendo transacciones");
    }
    console.log(
      "Transacciones obtenidas:",
      JSON.stringify(summarizeByMonth(data.data)),
    );
    return summarizeByMonth(data.data);
  } catch (error) {
    console.error("Error en getTransactions:", error);
    throw error;
  }
}

function summarizeByMonth(data) {
  const currentMonth = data
    .map((t) => t.month)
    .sort()
    .at(-1);

  return data.reduce(
    (acc, t) => {
      const amount = parseFloat(t.total_amount);

      if (t.month === currentMonth) {
        acc.currentMonth.push(t);
      } else {
        if (!acc.pastMonths[t.month]) {
          acc.pastMonths[t.month] = { income: 0, expenses: 0 };
        }
        t.isIncome
          ? (acc.pastMonths[t.month].income += amount)
          : (acc.pastMonths[t.month].expenses += amount);
      }

      return acc;
    },
    { currentMonth: [], pastMonths: {} },
  );
}

async function getBudgets(userID, cardID) {
  try {
    const response = await fetch(
      `${process.env.API_URL}:${process.env.DB_PORT}/AI/getUserAndCardBudgets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ userID, cardID }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.data || "Error obteniendo presupuestos");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getBudgets:", error);
    throw error;
  }
}

//------------------------------------------------------------------------

app.listen(4000, () => {
  console.log(`Microservicio IA corriendo en puerto ${process.env.PORT}`);
});
