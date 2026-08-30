const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

const BACKUP_DIR = path.join(__dirname, 'backups');

async function backupCaracteristicas() {
  await connectDB();

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `caracteristicas_${timestamp}.json`);

  const tipos = await TipoInmueble.find().lean();
  const caracteristicas = await CaracteristicaTipo.find().lean();

  const backup = {
    fecha: new Date().toISOString(),
    tipos,
    caracteristicas,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`Backup guardado en: ${backupFile}`);
  console.log(`  Tipos: ${tipos.length}`);
  console.log(`  Características: ${caracteristicas.length}`);

  await mongoose.disconnect();
  return backupFile;
}

if (require.main === module) {
  backupCaracteristicas()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { backupCaracteristicas };
