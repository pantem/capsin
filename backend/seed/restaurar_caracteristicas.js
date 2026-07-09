const mongoose = require('mongoose');
const connectDB = require('../config/db');
const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

const CARACTERISTICAS = [
  {
    nombre: 'Datos Generales - Fecha y hora',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 0,
  },
  {
    nombre: 'Datos Generales - Nombre del capturista',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 1,
  },
  {
    nombre: 'Datos Generales - Área a la que pertenece',
    tipo_dato: 'seleccion',
    opciones: ['Protección Civil', 'Bomberos', 'Cruz Roja', 'Seguridad Pública', 'Salud', 'Educación', 'Otro'],
    requerido: true,
    orden: 2,
  },
  {
    nombre: 'Información del inmueble - Calle y Número',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 3,
  },
  {
    nombre: 'Información del inmueble - Colonia',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 4,
  },
  {
    nombre: 'Información del inmueble - Alcaldía',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 5,
  },
  {
    nombre: 'Información del inmueble - Código Postal',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 6,
  },
  {
    nombre: 'Información del inmueble - Coordenadas geográficas',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 7,
  },
  {
    nombre: 'Uso del Inmueble',
    tipo_dato: 'seleccion',
    opciones: ['Vivienda Unifamiliar', 'Vivienda Multifamiliar', 'Escuela', 'Hospital', 'Oficina', 'Comercio', 'Otro'],
    requerido: true,
    orden: 8,
  },
  {
    nombre: 'Número de niveles',
    tipo_dato: 'numero',
    opciones: [],
    requerido: true,
    orden: 9,
  },
  {
    nombre: 'Fecha aproximada de construcción',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 10,
  },
  {
    nombre: 'Tipo de daño observado',
    tipo_dato: 'multiseleccion',
    opciones: ['Grietas leves', 'Grietas estructurales', 'Desprendimiento de acabados', 'Daño en columnas', 'Daño en trabes', 'Inclinación', 'Colapso parcial', 'Colapso total'],
    requerido: true,
    orden: 11,
  },
  {
    nombre: 'Condición de seguridad',
    tipo_dato: 'seleccion',
    opciones: ['Edificación segura', 'Riesgo alto', 'Riesgo medio', 'Riesgo bajo'],
    requerido: true,
    orden: 12,
  },
  {
    nombre: 'Observaciones adicionales',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 13,
  },
  {
    nombre: 'Fotografías',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 14,
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
