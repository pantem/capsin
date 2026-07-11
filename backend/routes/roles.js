const express = require('express');
const router = express.Router();
const Rol = require('../models/Rol');

router.get('/', async (req, res) => {
  try {
    const roles = await Rol.find().sort({ nombre: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rol = await Rol.findById(req.params.id);
    if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json(rol);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/permisos-disponibles', async (req, res) => {
  res.json(Rol.PERMISOS_DISPONIBLES);
});

router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, permisos } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const existe = await Rol.findOne({ nombre });
    if (existe) return res.status(400).json({ error: 'El rol ya existe' });
    const rol = new Rol({ nombre, descripcion: descripcion || '', permisos: permisos || [] });
    await rol.save();
    res.status(201).json(rol);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, permisos, activo } = req.body;
    const update = {};
    if (nombre !== undefined) {
      const duplicado = await Rol.findOne({ nombre, _id: { $ne: req.params.id } });
      if (duplicado) return res.status(400).json({ error: 'El rol ya existe' });
      update.nombre = nombre;
    }
    if (descripcion !== undefined) update.descripcion = descripcion;
    if (permisos !== undefined) update.permisos = permisos;
    if (activo !== undefined) update.activo = activo;
    const rol = await Rol.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json(rol);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const Usuario = require('../models/Usuario');
    const usersWithRol = await Usuario.countDocuments({ rol: req.params.id });
    if (usersWithRol > 0) {
      return res.status(400).json({ error: `No se puede eliminar: ${usersWithRol} usuario(s) tienen este rol` });
    }
    const rol = await Rol.findByIdAndDelete(req.params.id);
    if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json({ message: 'Rol eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
