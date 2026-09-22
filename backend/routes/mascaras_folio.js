const express = require('express');
const router = express.Router();
const MascaraFolio = require('../models/MascaraFolio');

router.get('/', async (req, res) => {
  try {
    const filtros = {};
    if (req.query.aplica_a) filtros.aplica_a = req.query.aplica_a;
    if (req.query.activo !== undefined) filtros.activo = req.query.activo === 'true';
    const mascaras = await MascaraFolio.find(filtros).sort({ nombre: 1 });
    res.json(mascaras);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const mascara = await MascaraFolio.findById(req.params.id);
    if (!mascara) return res.status(404).json({ error: 'Máscara no encontrada' });
    res.json(mascara);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, formato, prefijo, longitud_secuencia, aplica_a } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    if (!formato) return res.status(400).json({ error: 'Formato requerido' });
    const existe = await MascaraFolio.findOne({ nombre });
    if (existe) return res.status(400).json({ error: 'La máscara ya existe' });
    const mascara = new MascaraFolio({
      nombre,
      descripcion: descripcion || '',
      formato,
      prefijo: prefijo || '',
      longitud_secuencia: longitud_secuencia || 4,
      aplica_a: aplica_a || 'ambos',
    });
    await mascara.save();
    res.status(201).json(mascara);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, formato, prefijo, longitud_secuencia, secuencia_actual, aplica_a, activo } = req.body;
    const update = {};
    if (nombre !== undefined) {
      const duplicado = await MascaraFolio.findOne({ nombre, _id: { $ne: req.params.id } });
      if (duplicado) return res.status(400).json({ error: 'La máscara ya existe' });
      update.nombre = nombre;
    }
    if (descripcion !== undefined) update.descripcion = descripcion;
    if (formato !== undefined) update.formato = formato;
    if (prefijo !== undefined) update.prefijo = prefijo;
    if (longitud_secuencia !== undefined) update.longitud_secuencia = longitud_secuencia;
    if (secuencia_actual !== undefined) update.secuencia_actual = secuencia_actual;
    if (aplica_a !== undefined) update.aplica_a = aplica_a;
    if (activo !== undefined) update.activo = activo;
    const mascara = await MascaraFolio.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!mascara) return res.status(404).json({ error: 'Máscara no encontrada' });
    res.json(mascara);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const mascara = await MascaraFolio.findByIdAndDelete(req.params.id);
    if (!mascara) return res.status(404).json({ error: 'Máscara no encontrada' });
    res.json({ message: 'Máscara eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
