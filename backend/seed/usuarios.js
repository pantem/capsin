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
  await Usuario.updateMany(
    { area: { $exists: false } },
    { $set: { area: '', rol: 'capturista' } },
  );

  for (const u of USUARIOS) {
    const existente = await Usuario.findOne({ username: u.username });
    if (!existente) {
      await new Usuario(u).save();
      console.log(`Usuario creado: ${u.username}`);
    } else {
      await Usuario.updateOne({ username: u.username }, { $set: { area: u.area, rol: u.rol } });
      console.log(`Usuario actualizado: ${u.username}`);
    }
  }
}

module.exports = { seedUsuarios };
