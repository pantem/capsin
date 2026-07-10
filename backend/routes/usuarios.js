const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find().sort({ nombre: 1 });
    res.json(usuarios.map(u => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, username, password } = req.body;
    if (!nombre || !username || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });
    }
    const existe = await Usuario.findOne({ username });
    if (existe) return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    const usuario = new Usuario({ nombre, username, password, activo: true });
    await usuario.save();
    res.status(201).json(usuario.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, username, password, activo } = req.body;
    const update = {};
    if (nombre !== undefined) update.nombre = nombre;
    if (username !== undefined) {
      const duplicado = await Usuario.findOne({ username, _id: { $ne: req.params.id } });
      if (duplicado) return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      update.username = username;
    }
    if (activo !== undefined) update.activo = activo;
    if (password) {
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      usuario.password = password;
      usuario.nombre = update.nombre || usuario.nombre;
      usuario.username = update.username || usuario.username;
      if (activo !== undefined) usuario.activo = activo;
      await usuario.save();
      return res.json(usuario.toJSON());
    }
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
