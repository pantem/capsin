const express = require('express');
const router = express.Router();
const Inmueble = require('../models/Inmueble');
const Damnificado = require('../models/Damnificado');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.siniestro) filter.siniestro = req.query.siniestro;
    if (req.query.padre) filter.padre = req.query.padre === 'null' ? null : req.query.padre;
    const inmuebles = await Inmueble.find(filter).populate('padre').sort({ creado_en: -1 });
    res.json(inmuebles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inmueble = await Inmueble.findById(req.params.id).populate('padre');
    if (!inmueble) return res.status(404).json({ error: 'Inmueble no encontrado' });
    res.json(inmueble);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/hijos', async (req, res) => {
  try {
    const hijos = await Inmueble.find({ padre: req.params.id }).sort({ identificador: 1 });
    res.json(hijos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const inmueble = new Inmueble(req.body);
    const saved = await inmueble.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Inmueble.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Inmueble no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Damnificado.deleteMany({ inmueble: req.params.id });
    await Inmueble.deleteMany({ padre: req.params.id });
    const deleted = await Inmueble.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Inmueble no encontrado' });
    res.json({ message: 'Inmueble y sus dependencias eliminados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
