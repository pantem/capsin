const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'siniestros-sismo-secret-key-2026';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const usuario = await Usuario.findOne({ username, activo: true }).populate('rol', 'nombre permisos').populate('area', 'nombre');
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valida = await usuario.comparePassword(password);
    if (!valida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const userData = usuario.toJSON();
    const permisos = (usuario.rol && usuario.rol.permisos) || [];

    const token = jwt.sign(
      {
        id: usuario._id,
        username: usuario.username,
        nombre: usuario.nombre,
        permisos,
        area: userData.area,
        rol: userData.rol,
      },
      JWT_SECRET,
      { expiresIn: '365d' },
    );

    res.json({
      token,
      usuario: {
        ...userData,
        permisos,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
