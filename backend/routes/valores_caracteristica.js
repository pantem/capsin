const express = require('express');
const router = express.Router();
const ValorCaracteristica = require('../models/ValorCaracteristica');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.inmueble) filter.inmueble = req.query.inmueble;
    const valores = await ValorCaracteristica.find(filter).populate('caracteristica');
    const valoresValidos = valores.filter(v => v.caracteristica != null);
    res.json(valoresValidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
