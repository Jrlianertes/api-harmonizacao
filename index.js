const express = require('express');
const fetch = global.fetch;
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =============================
// 🔑 SUPABASE
// =============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// =============================
// 🍷 HARMONIZAÇÃO
// =============================
app.post('/harmonizar', async (req, res) => {
  try {
    const { user_id, prato } = req.body;

    if (!user_id || !prato) {
      return res.status(400).json({
        erro: "Dados incompletos"
      });
    }

    // 🔍 buscar vinhos do usuário
    const { data, error } = await supabase
      .from('lista_adega00')
      .select('produto')
      .eq('usuario', user_id);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        resposta: "Você ainda não possui vinhos cadastrados."
      });
    }

    const vinhos = data.map(v => v.produto).join(', ');

    // 🤖 chamada IA (Gemini)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Tenho estes vinhos: ${vinhos}. Qual harmoniza melhor com ${prato}? Seja direto e responda de forma breve e objetiva.`
                }
              ]
            }
          ]
        })
      }
    );

    const json = await response.json();

    const texto =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Não foi possível gerar a harmonização.";

    res.json({ resposta: texto });

  } catch (err) {
    console.error("ERRO HARMONIZAÇÃO:", err);

    res.status(500).json({
      erro: "Erro na harmonização",
      detalhe: err.message
    });
  }
});

// =============================
// 🧪 TESTE API
// =============================
app.get('/', (req, res) => {
  res.send("API Harmonização 🍷 rodando");
});

// =============================
// 🚀 START
// =============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});