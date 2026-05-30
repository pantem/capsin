const express = require('express');
const router = express.Router();
const Damnificado = require('../models/Damnificado');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.inmueble) filter.inmueble = req.query.inmueble;
    const damnificados = await Damnificado.find(filter).sort({ creado_en: -1 });
    res.json(damnificados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const damnificado = await Damnificado.findById(req.params.id);
    if (!damnificado) return res.status(404).json({ error: 'Damnificado no encontrado' });
    res.json(damnificado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const damnificado = new Damnificado(req.body);
    const saved = await damnificado.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Damnificado.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Damnificado no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Damnificado.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Damnificado no encontrado' });
    res.json({ message: 'Damnificado eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
