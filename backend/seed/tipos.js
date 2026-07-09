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

async function seedTiposInmueble() {
  let tipo = await TipoInmueble.findOne({ nombre: 'Inmueble Genérico' });
  if (tipo) {
    console.log('Inmueble Genérico ya existe, sincronizando características...');
    const existentes = await CaracteristicaTipo.find({ tipo_inmueble: tipo._id });
    const existentesMap = new Map(existentes.map(c => [c.nombre, c]));
    for (const c of CARACTERISTICAS) {
      const existente = existentesMap.get(c.nombre);
      if (existente) {
        if (existente.tipo_dato !== c.tipo_dato || JSON.stringify(existente.opciones) !== JSON.stringify(c.opciones) || existente.requerido !== c.requerido || existente.orden !== c.orden) {
          await CaracteristicaTipo.findByIdAndUpdate(existente._id, c);
        }
      } else {
        await new CaracteristicaTipo({ ...c, tipo_inmueble: tipo._id }).save();
      }
    }
    return;
  }

  tipo = await new TipoInmueble({
    nombre: 'Inmueble Genérico',
    descripcion: 'Tipo de inmueble único con características configurables desde el panel de administración',
    activo: true,
  }).save();

  for (const c of CARACTERISTICAS) {
    await new CaracteristicaTipo({ ...c, tipo_inmueble: tipo._id }).save();
  }

  console.log(`Inmueble Genérico creado con ${CARACTERISTICAS.length} características`);
}

module.exports = { seedTiposInmueble };
