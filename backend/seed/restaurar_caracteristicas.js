const mongoose = require('mongoose');
const connectDB = require('../config/db');
const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

const CARACTERISTICAS = [
  {
    nombre: 'Uso del Inmueble',
    tipo_dato: 'seleccion',
    opciones: ['Vivienda Unifamiliar', 'Vivienda Multifamiliar', 'Escuela', 'Hospital', 'Oficina', 'Comercio', 'Otro'],
    requerido: true,
    orden: 0,
  },
  {
    nombre: 'Número de niveles',
    tipo_dato: 'numero',
    opciones: [],
    requerido: true,
    orden: 1,
  },
  {
    nombre: 'Fecha aproximada de construcción',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 2,
  },
  {
    nombre: 'Tipo de daño observado',
    tipo_dato: 'multiseleccion',
    opciones: ['Grietas leves', 'Grietas estructurales', 'Desprendimiento de acabados', 'Daño en columnas', 'Daño en trabes', 'Inclinación', 'Colapso parcial', 'Colapso total'],
    requerido: true,
    orden: 3,
  },
  {
    nombre: 'Condición de seguridad',
    tipo_dato: 'seleccion',
    opciones: ['Edificación segura', 'Riesgo alto', 'Riesgo medio', 'Riesgo bajo'],
    requerido: true,
    orden: 4,
  },
];

async function restaurar() {
  await connectDB();

  let tipo = await TipoInmueble.findOne({ nombre: 'Inmueble Genérico' });
  if (!tipo) {
    console.log('Inmueble Genérico no encontrado, créalo desde el dashboard');
    process.exit(1);
  }

  await CaracteristicaTipo.deleteMany({ tipo_inmueble: tipo._id });
  console.log('Características antiguas eliminadas');

  for (const c of CARACTERISTICAS) {
    await new CaracteristicaTipo({ ...c, tipo_inmueble: tipo._id }).save();
    console.log(`  Creada: ${c.nombre}`);
  }

  console.log(`\n${CARACTERISTICAS.length} características restauradas correctamente`);
  process.exit(0);
}

restaurar().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
