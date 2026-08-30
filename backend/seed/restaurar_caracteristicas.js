const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

const BACKUP_DIR = path.join(__dirname, 'backups');

async function restaurarCaracteristicas(backupFile) {
  await connectDB();

  if (!backupFile) {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('No existe directorio de backups');
      await mongoose.disconnect();
      process.exit(1);
    }

    const archivos = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('caracteristicas_') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (archivos.length === 0) {
      console.error('No hay backups disponibles');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Backups disponibles:');
    archivos.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    console.log(`\nUso: node seed/restaurar_caracteristicas.js <nombre_archivo>`);
    await mongoose.disconnect();
    return;
  }

  const backupPath = path.join(BACKUP_DIR, backupFile);
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup no encontrado: ${backupPath}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`Restaurando backup del: ${backup.fecha}`);
  console.log(`  Tipos: ${backup.tipos.length}`);
  console.log(`  Características: ${backup.caracteristicas.length}`);

  for (const tipo of backup.tipos) {
    const existente = await TipoInmueble.findOne({ nombre: tipo.nombre });
    if (existente) {
      await TipoInmueble.findByIdAndUpdate(existente._id, {
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        activo: tipo.activo,
      });
      console.log(`  Tipo actualizado: ${tipo.nombre}`);
    } else {
      const { _id, ...tipoData } = tipo;
      await new TipoInmueble(tipoData).save();
      console.log(`  Tipo creado: ${tipo.nombre}`);
    }
  }

  await CaracteristicaTipo.deleteMany({});

  for (const c of backup.caracteristicas) {
    const { _id, ...cData } = c;
    await new CaracteristicaTipo(cData).save();
  }

  console.log(`\nRestauración completada: ${backup.caracteristicas.length} características restauradas`);
  await mongoose.disconnect();
}

const archivo = process.argv[2];
restaurarCaracteristicas(archivo)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
