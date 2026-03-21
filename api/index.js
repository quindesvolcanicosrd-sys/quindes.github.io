const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Cliente Supabase con service role (acceso total)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// ── Test de conexión ──────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ligas')
      .select('id, nombre')
      .limit(1);

    if (error) throw error;

    res.json({
      status: 'ok',
      liga: data[0]?.nombre || 'sin datos'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});