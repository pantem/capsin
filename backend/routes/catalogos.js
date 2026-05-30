const express = require('express');
const router = express.Router();
const CodigoPostal = require('../models/CodigoPostal');

router.get('/codigos-postales', async (req, res) => {
  try {
    const { codigo, q, limit } = req.query;
    let filter = {};
    if (codigo) {
      filter.codigo = codigo;
    } else if (q !== undefined && q !== null) {
      const s = q.trim();
      if (s) {
        const isNum = /^\d+$/.test(s);
        if (isNum) {
          filter.codigo = { $regex: `^${s}`, $options: 'i' };
        } else {
          filter.colonia = { $regex: s, $options: 'i' };
        }
      }
    }
    const max = parseInt(limit, 10) || 20;
    const results = await CodigoPostal.find(filter).sort({ codigo: 1, colonia: 1 }).limit(max);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/codigos-postales/municipios', async (req, res) => {
  try {
    const municipios = await CodigoPostal.distinct('municipio', { estado: 'CDMX' });
    res.json(municipios.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
