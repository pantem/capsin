const express = require('express');
const router = express.Router();
const Area = require('../models/Area');

router.get('/', async (req, res) => {
  try {
    const areas = await Area.find().sort({ nombre: 1 });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) return res.status(404).json({ error: 'Área no encontrada' });
    res.json(area);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const existe = await Area.findOne({ nombre });
    if (existe) return res.status(400).json({ error: 'El área ya existe' });
    const area = new Area({ nombre, descripcion: descripcion || '' });
    await area.save();
    res.status(201).json(area);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    const update = {};
    if (nombre !== undefined) {
      const duplicado = await Area.findOne({ nombre, _id: { $ne: req.params.id } });
      if (duplicado) return res.status(400).json({ error: 'El área ya existe' });
      update.nombre = nombre;
    }
    if (descripcion !== undefined) update.descripcion = descripcion;
    if (activo !== undefined) update.activo = activo;
    const area = await Area.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!area) return res.status(404).json({ error: 'Área no encontrada' });
    res.json(area);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const Usuario = require('../models/Usuario');
    const usersInArea = await Usuario.countDocuments({ area: req.params.id });
    if (usersInArea > 0) {
      return res.status(400).json({ error: `No se puede eliminar: ${usersInArea} usuario(s) pertenecen a esta área` });
    }
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ error: 'Área no encontrada' });
    res.json({ message: 'Área eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
