const Usuario = require('../models/Usuario');

const USUARIOS = [
  {
    nombre: 'Administrador',
    username: 'admin',
    password: 'admin123',
    area: 'Protección Civil',
    rol: 'admin',
    activo: true,
  },
];

async function seedUsuarios() {
  for (const u of USUARIOS) {
    const existente = await Usuario.findOne({ username: u.username });
    if (!existente) {
      await new Usuario(u).save();
      console.log(`Usuario creado: ${u.username}`);
    }
  }
}

module.exports = { seedUsuarios };
