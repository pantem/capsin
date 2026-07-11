const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const Area = require('../models/Area');
const Rol = require('../models/Rol');

router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find().populate('area', 'nombre').populate('rol', 'nombre permisos').sort({ nombre: 1 });
    res.json(usuarios.map(u => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).populate('area', 'nombre').populate('rol', 'nombre permisos');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, username, password, area, rol } = req.body;
    if (!nombre || !username || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });
    }
    const existe = await Usuario.findOne({ username });
    if (existe) return res.status(400).json({ error: 'El nombre de usuario ya existe' });

    let areaRef = null;
    if (area) {
      if (typeof area === 'string' && area.match(/^[0-9a-fA-F]{24}$/)) {
        areaRef = area;
      } else if (typeof area === 'string') {
        const areaDoc = await Area.findOne({ nombre: area });
        if (areaDoc) areaRef = areaDoc._id;
      } else {
        areaRef = area;
      }
    }

    let rolRef = null;
    if (rol) {
      if (typeof rol === 'string' && rol.match(/^[0-9a-fA-F]{24}$/)) {
        rolRef = rol;
      } else if (typeof rol === 'string') {
        const rolDoc = await Rol.findOne({ nombre: rol });
        if (rolDoc) rolRef = rolDoc._id;
      }
    }

    const usuario = new Usuario({ nombre, username, password, area: areaRef, rol: rolRef, activo: true });
    await usuario.save();
    const saved = await Usuario.findById(usuario._id).populate('area', 'nombre').populate('rol', 'nombre permisos');
    res.status(201).json(saved.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, username, password, area, rol, activo } = req.body;
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (nombre !== undefined) usuario.nombre = nombre;
    if (username !== undefined) {
      const duplicado = await Usuario.findOne({ username, _id: { $ne: req.params.id } });
      if (duplicado) return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      usuario.username = username;
    }
    if (area !== undefined) {
      if (typeof area === 'string' && area.match(/^[0-9a-fA-F]{24}$/)) {
        usuario.area = area;
      } else if (typeof area === 'string') {
        const areaDoc = await Area.findOne({ nombre: area });
        usuario.area = areaDoc ? areaDoc._id : null;
      } else {
        usuario.area = area;
      }
    }
    if (rol !== undefined) {
      if (typeof rol === 'string' && rol.match(/^[0-9a-fA-F]{24}$/)) {
        usuario.rol = rol;
      } else if (typeof rol === 'string') {
        const rolDoc = await Rol.findOne({ nombre: rol });
        usuario.rol = rolDoc ? rolDoc._id : null;
      } else {
        usuario.rol = rol;
      }
    }
    if (activo !== undefined) usuario.activo = activo;
    if (password) usuario.password = password;

    await usuario.save();
    const updated = await Usuario.findById(usuario._id).populate('area', 'nombre').populate('rol', 'nombre permisos');
    res.json(updated.toJSON());
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
