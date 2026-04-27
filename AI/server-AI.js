const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const axios = require("axios");

app.use(express.json());

//--------------------------------------------MAIN------------------------------------------
async function AI_analyze(datos) {
  const prompt = `
  Analiza estos datos de ventas y dame insights:
  ${JSON.stringify(datos)}
  `;

  const response = await axios.post("http://localhost:4000/api/generate", {
    model: "llama3",
    prompt: prompt,
    stream: false,
  });

  return response.data.response;
}
//------------------------------------------------------------------------------------------

app.get("/AI/analyzeBudgets", async (req, res) => {
  try {
    const response = await fetch("http://localhost:3000/api/transactions", {
      headers: {
        "x-internal-key": process.env.INTERNAL_API_KEY,
      },
      body: 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => {
  console.log("Microservicio IA corriendo en puerto 4000");
});
