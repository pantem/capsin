const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Usuario = require('../models/Usuario');

async function migrar() {
  await connectDB();

  const result = await Usuario.updateMany(
    { area: { $exists: false } },
    { $set: { area: 'Protección Civil', rol: 'capturista' } },
  );
  console.log(`Usuarios sin area/rol actualizados: ${result.modifiedCount}`);

  await Usuario.updateOne(
    { username: 'admin' },
    { $set: { area: 'Protección Civil', rol: 'admin' } },
  );
  console.log('Admin actualizado a rol admin');

  mongoose.disconnect();
  console.log('Listo');
}

migrar().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
