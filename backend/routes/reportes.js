const express = require('express');
const router = express.Router();
const Siniestro = require('../models/Siniestro');
const Inmueble = require('../models/Inmueble');
const Damnificado = require('../models/Damnificado');
const ValorCaracteristica = require('../models/ValorCaracteristica');
const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');
const { generarFolio } = require('../services/folioService');
const { fechaMX } = require('../utils/fechas');

function derivarEstadoPorRiesgo(valor) {
  const s = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (!s) return 'sin_daños';
  if (s.includes('colapso')) return 'colapso';
  if (s.includes('alto') || s.includes('critic')) return 'critico';
  if (s.includes('medio')) return 'moderado';
  return 'sin_daños';
}

async function clasificacionRiesgo(valores, obtenerId) {
  try {
    const caracts = await CaracteristicaTipo.find({
      nombre: { $regex: 'riesgo|clasificaci', $options: 'i' },
    }).lean();
    const ids = new Set(caracts.map(c => String(c._id)));
    if (ids.size > 0) {
      const porNombre = valores.find(v => ids.has(String(obtenerId(v) || '')));
      if (porNombre) return porNombre;
    }
  } catch (_) {
    // si falla el catálogo se usa el respaldo por contenido
  }
  return valores.find(v => /riesgo|colapso/i.test(String(v.valor_seleccion || v.valor_texto || '')));
}

router.post('/sync', async (req, res) => {
  try {
    const { reportes, dispositivo_id } = req.body;
    if (!reportes || !Array.isArray(reportes)) {
      return res.status(400).json({ error: 'reportes requerido' });
    }

    const tipoGenerico = await TipoInmueble.findOne({ nombre: 'Inmueble Genérico' });

    const results = [];
    for (const item of reportes) {
      const { valores_caracteristica, damnificados, ...reporteData } = item;

      let exists = null;
      if (reporteData.reporte_id) {
        exists = await Siniestro.findOne({ reporte_local_id: reporteData.reporte_id });
      }
      if (!exists) {
        exists = await Siniestro.findOne({ folio_original: reporteData.folio });
      }
      if (!exists) {
        const porFolio = await Siniestro.findOne({ folio: reporteData.folio });
        if (porFolio && (!porFolio.dispositivo_id || porFolio.dispositivo_id === (dispositivo_id || ''))) {
          exists = porFolio;
        }
      }
      let siniestro;

      let folioFinal = reporteData.folio;
      if (!exists) {
        const nuevoFolio = await generarFolio('siniestros');
        if (nuevoFolio) {
          folioFinal = nuevoFolio;
        }
      }

      const siniestroData = {
        folio: folioFinal,
        folio_original: exists ? exists.folio_original : reporteData.folio,
        fecha: fechaMX(reporteData.fecha, new Date()),
        fecha_sincronizacion: fechaMX(reporteData.fecha_sincronizacion, new Date()),
        ubicacion: {
          lat: reporteData.lat || 0,
          lng: reporteData.lng || 0,
          direccion: [reporteData.calle_numero, reporteData.colonia].filter(Boolean).join(', '),
          municipio: reporteData.alcaldia || '',
          estado: 'CDMX',
          codigo_postal: reporteData.codigo_postal || '',
        },
        descripcion: reporteData.observaciones || '',
        capturista: (reporteData.nombre_capturista || '').trim(),
        area: (reporteData.area || '').trim(),
        reporte_local_id: exists ? (exists.reporte_local_id || reporteData.reporte_id || null) : (reporteData.reporte_id || null),
        dispositivo_id: dispositivo_id || '',
        sincronizado: true,
      };

      if (exists) {
        siniestro = await Siniestro.findByIdAndUpdate(exists._id, siniestroData, { new: true });
        const inmueblesViejos = await Inmueble.find({ siniestro: siniestro._id }).select('_id');
        const inmuebleIds = inmueblesViejos.map(i => i._id);
        if (inmuebleIds.length > 0) {
          await Damnificado.deleteMany({ inmueble: { $in: inmuebleIds } });
          await ValorCaracteristica.deleteMany({ inmueble: { $in: inmuebleIds } });
        }
        await Inmueble.deleteMany({ siniestro: siniestro._id });
      } else {
        siniestro = new Siniestro(siniestroData);
        siniestro = await siniestro.save();
      }

      const inmuebleData = {
        siniestro: siniestro._id,
        tipo: 'Inmueble Genérico',
        tipo_inmueble_ref: tipoGenerico ? tipoGenerico._id : null,
        numero_niveles: (reporteData.sobre_nivel_banqueta || 0) + (reporteData.bajo_nivel_banqueta || 0),
        sobre_nivel_banqueta: reporteData.sobre_nivel_banqueta || 0,
        bajo_nivel_banqueta: reporteData.bajo_nivel_banqueta || 0,
        identificador: '',
        estado_afectacion: reporteData.estado_afectacion || 'sin_daños',
        observaciones: '',
        sincronizado: true,
      };
      const inmueble = await new Inmueble(inmuebleData).save();

      if (valores_caracteristica && Array.isArray(valores_caracteristica)) {
        for (const v of valores_caracteristica) {
          await new ValorCaracteristica({
            inmueble: inmueble._id,
            caracteristica: v.caracteristica_id || null,
            valor_texto: v.valor_texto || null,
            valor_numero: v.valor_numero || null,
            valor_booleano: v.valor_booleano != null ? Boolean(v.valor_booleano) : null,
            valor_seleccion: v.valor_seleccion || null,
            valor_texto_condicional: v.valor_texto_condicional || null,
          }).save();
        }

        const clasificacion = await clasificacionRiesgo(valores_caracteristica, v => v.caracteristica_id);
        if (clasificacion) {
          await Inmueble.findByIdAndUpdate(inmueble._id, {
            estado_afectacion: derivarEstadoPorRiesgo(clasificacion.valor_seleccion || clasificacion.valor_texto),
          });
        }
      }

      if (damnificados && Array.isArray(damnificados)) {
        for (const d of damnificados) {
          await new Damnificado({
            inmueble: inmueble._id,
            nombre: d.nombre || '',
            edad: d.edad || 0,
            sexo: d.sexo || '',
            tipo_identificacion: d.tipo_identificacion || '',
            numero_identificacion: d.numero_identificacion || '',
            estado: d.estado || 'ileso',
            requiere_traslado: d.requiere_traslado ? true : false,
            observaciones: d.observaciones || '',
            sincronizado: true,
          }).save();
        }
      }

      results.push({ _id: siniestro._id, folio: siniestro.folio });
    }

    res.json({ message: `${results.length} reporte(s) sincronizado(s)`, siniestros: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pull', async (req, res) => {
  try {
    const filter = {};
    if (req.query.dispositivo) {
      filter.dispositivo_id = req.query.dispositivo;
    }
    const siniestros = await Siniestro.find(filter).sort({ fecha: -1 }).lean();
    const results = [];

    for (const s of siniestros) {
      const inmuebles = await Inmueble.find({ siniestro: s._id }).lean();
      let primerInmueble = inmuebles.length > 0 ? inmuebles[0] : null;
      let valores = [];
      let damnificadosData = [];

      if (primerInmueble) {
        valores = await ValorCaracteristica.find({ inmueble: primerInmueble._id }).lean();
        damnificadosData = await Damnificado.find({ inmueble: primerInmueble._id }).lean();
      }

      results.push({
        folio: s.folio,
        folio_original: s.folio_original || '',
        reporte_local_id: s.reporte_local_id || '',
        fecha: s.fecha ? new Date(s.fecha).toISOString() : new Date().toISOString(),
        fecha_sincronizacion: s.fecha_sincronizacion ? new Date(s.fecha_sincronizacion).toISOString() : null,
        nombre_capturista: s.capturista || '',
        area: s.area || '',
        calle_numero: s.ubicacion?.direccion || '',
        colonia: '',
        alcaldia: s.ubicacion?.municipio || '',
        codigo_postal: s.ubicacion?.codigo_postal || '',
        lat: s.ubicacion?.lat || null,
        lng: s.ubicacion?.lng || null,
        uso_inmueble: '',
        otro_uso: null,
        fecha_construccion: '',
        numero_niveles: primerInmueble?.numero_niveles || 1,
        sobre_nivel_banqueta: primerInmueble?.sobre_nivel_banqueta || 0,
        bajo_nivel_banqueta: primerInmueble?.bajo_nivel_banqueta || 0,
        estado_afectacion: primerInmueble?.estado_afectacion || 'sin_daños',
        danos_observados: '',
        condicion_seguridad: '',
        observaciones: s.descripcion || '',
        fotos: (s.fotos || []).map(f => f.url).join(', '),
        valores_caracteristica: valores.map(v => ({
          caracteristica_id: v.caracteristica ? v.caracteristica.toString() : '',
          valor_texto: v.valor_texto || null,
          valor_numero: v.valor_numero || null,
          valor_booleano: v.valor_booleano == null ? null : (v.valor_booleano ? 1 : 0),
          valor_seleccion: v.valor_seleccion || null,
          valor_texto_condicional: v.valor_texto_condicional || null,
        })),
        damnificados: damnificadosData.map(d => ({
          nombre: d.nombre || '',
          edad: d.edad || 0,
          sexo: d.sexo || '',
          tipo_identificacion: d.tipo_identificacion || '',
          numero_identificacion: d.numero_identificacion || '',
          estado: d.estado || 'ileso',
          requiere_traslado: d.requiere_traslado ? 1 : 0,
          observaciones: d.observaciones || '',
        })),
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fix-estados', async (req, res) => {
  try {
    const inmuebles = await Inmueble.find({}).lean();
    let corregidos = 0;
    for (const inm of inmuebles) {
      const valores = await ValorCaracteristica.find({ inmueble: inm._id }).lean();
      const clasificacion = await clasificacionRiesgo(valores, v => v.caracteristica);
      if (!clasificacion) continue;
      const derived = derivarEstadoPorRiesgo(clasificacion.valor_seleccion || clasificacion.valor_texto);
      if (inm.estado_afectacion !== derived) {
        await Inmueble.findByIdAndUpdate(inm._id, { estado_afectacion: derived });
        corregidos++;
      }
    }
    res.json({ message: `${corregidos} inmueble(s) corregido(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
