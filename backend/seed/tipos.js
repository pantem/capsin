const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

const OPCIONES_NO_DUDAS = ['Sí', 'No'];
const OPCIONES_SI_NO = ['Sí', 'No'];

const CARACTERISTICAS = [
  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 2: Ubicación y Descripción de la Edificación
  // ═══════════════════════════════════════════════════════════════
  {
    nombre: '2.1 Calle y Número',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 1,
  },
  {
    nombre: '2.2 Colonia',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 2,
  },
  {
    nombre: '2.3 Alcaldía',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 3,
  },
  {
    nombre: '2.4 Código Postal',
    tipo_dato: 'texto',
    opciones: [],
    requerido: true,
    orden: 4,
  },
  {
    nombre: '2.5 Entre que calles / Referencia',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 5,
  },
  {
    nombre: '2.6 Responsable del Inmueble',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 6,
  },
  {
    nombre: '2.7 Teléfono del Responsable del Inmueble',
    tipo_dato: 'numero',
    opciones: [],
    requerido: true,
    orden: 7,
  },
  {
    nombre: '2.8 Año estimado de la Construcción',
    tipo_dato: 'numero',
    opciones: [],
    requerido: true,
    orden: 8,
    minimo: 1700,
    maximo: 2026,
  },
  {
    nombre: '2.9 Uso del Inmueble',
    tipo_dato: 'seleccion',
    opciones: [
      'HABITACIÓN UNIFAMILIAR',
      'HABITACIÓN MULTIFAMILIAR',
      'CENTRO DE REUNIÓN',
      'OFICINAS PRIVADAS',
      'INDUSTRIAS',
      'RECREATIVO',
      'COMERCIOS',
      'ESTACIONAMIENTO',
      'EDUCACIÓN',
      'OFICINAS PÚBLICAS',
      'BODEGAS',
      'MIXTO',
    ],
    requerido: true,
    orden: 9,
  },
  {
    nombre: '2.10 Número de niveles sobre el terreno',
    tipo_dato: 'seleccion',
    opciones: Array.from({ length: 100 }, (_, i) => String(i + 1)),
    requerido: true,
    orden: 10,
  },
  {
    nombre: '2.11 Número de sótanos',
    tipo_dato: 'seleccion',
    opciones: Array.from({ length: 100 }, (_, i) => String(i + 1)),
    requerido: true,
    orden: 11,
  },
  {
    nombre: '2.12 Número de ocupantes',
    tipo_dato: 'numero',
    opciones: [],
    requerido: false,
    orden: 12,
  },
  {
    nombre: '2.13  Tipo de inspección',
    tipo_dato: 'seleccion',
    opciones: ['INSPECCIÓN EXTERIOR ÚNICAMENTE', 'INSPECCIÓN INTERIOR Y EXTERIOR'],
    requerido: true,
    orden: 13,
  },

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 3: Estado de la Edificación
  // ═══════════════════════════════════════════════════════════════
  {
    nombre: '3.1 Colapso total',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 21,
  },
  {
    nombre: '3.2 Colapso parcial',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 22,
  },
  {
    nombre: '3.3 Edificación separada de su cimentación',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 23,
  },
  {
    nombre: '3.4 Asentamiento diferencial o hundimiento',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 24,
  },
  {
    nombre: '3.5 Inclinación notoria de la edificación o de algún entrepiso',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 25,
  },
  {
    nombre: '3.6 Daños severos en elementos estructurales (columnas, vigas, muros de carga)',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 26,
  },
  {
    nombre: '3.7 Daños moderados en elementos estructurales',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 27,
  },
  {
    nombre: '3.8 Daños severos en elementos no estructurales (muros divisorios, acabados, cancelería)',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 28,
  },
  {
    nombre: '3.9 Daños moderados en elementos no estructurales',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 29,
  },
  {
    nombre: '3.10 Daños en instalaciones eléctricas',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 30,
  },
  {
    nombre: '3.11 Daños en instalaciones hidrosanitarias',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 31,
  },
  {
    nombre: '3.12 Daños en instalaciones de gas',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 32,
  },
  {
    nombre: '3.13 Deslizamiento de talud o corte',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 33,
  },
  {
    nombre: '3.14 Pretiles, balcones u otros objetos en peligro de caer',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: false,
    orden: 34,
  },
  {
    nombre: '3.15 Otros peligros (líneas o ductos rotos, derrames tóxicos, etc.)',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_NO_DUDAS,
    requerido: true,
    orden: 35,
  },

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 4: Clasificación Global
  // ═══════════════════════════════════════════════════════════════
  {
    nombre: '4.1 Clasificación de Nivel de Daño',
    tipo_dato: 'seleccion',
    opciones: [
      'Edificación en Riesgo Bajo',
      'Área Insegura o Edificación en Riesgo Medio',
      'Edificación en Riesgo Alto',
    ],
    requerido: true,
    orden: 41,
  },

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 5: Recomendaciones
  // ═══════════════════════════════════════════════════════════════
  {
    nombre: '5.1 Requiere revisión futura',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 51,
  },
  {
    nombre: '5.2 Es necesaria evaluación detallada',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 52,
  },
  {
    nombre: '5.3 Apuntalar',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 53,
  },
  {
    nombre: '5.4 Maquinaria para remover escombro',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 54,
  },
  {
    nombre: '5.5 Inspección por SGIRPC',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 55,
  },
  {
    nombre: '5.6 Inspección por SACMEX',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 56,
  },
  {
    nombre: '5.7 Inspección por SSC',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 57,
  },
  {
    nombre: '5.8 Inspección por Central de fugas',
    tipo_dato: 'seleccion',
    opciones: OPCIONES_SI_NO,
    requerido: true,
    orden: 58,
  },

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 6: Observaciones y Fotografías
  // ═══════════════════════════════════════════════════════════════
  {
    nombre: '6.1 Fotografías (fachada, máximo 10)',
    tipo_dato: 'texto',
    opciones: [],
    requerido: false,
    orden: 61,
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
        if (existente.tipo_dato !== c.tipo_dato || JSON.stringify(existente.opciones) !== JSON.stringify(c.opciones) || existente.requerido !== c.requerido || existente.orden !== c.orden || existente.minimo !== c.minimo || existente.maximo !== c.maximo) {
          await CaracteristicaTipo.findByIdAndUpdate(existente._id, c);
        }
      } else {
        await new CaracteristicaTipo({ ...c, tipo_inmueble: tipo._id }).save();
      }
    }

    const nombresNuevos = new Set(CARACTERISTICAS.map(c => c.nombre));
    for (const e of existentes) {
      if (!nombresNuevos.has(e.nombre)) {
        await CaracteristicaTipo.findByIdAndDelete(e._id);
        console.log(`  Eliminada característica obsoleta: ${e.nombre}`);
      }
    }

    return;
  }

  tipo = await new TipoInmueble({
    nombre: 'Inmueble Genérico',
    descripcion: 'Tipo de inmueble con características detalladas de inspección sísmica conforme a protocolo CDMX',
    activo: true,
  }).save();

  for (const c of CARACTERISTICAS) {
    await new CaracteristicaTipo({ ...c, tipo_inmueble: tipo._id }).save();
  }

  console.log(`Inmueble Genérico creado con ${CARACTERISTICAS.length} características`);
}

module.exports = { seedTiposInmueble };
