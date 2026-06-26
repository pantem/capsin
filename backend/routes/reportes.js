const express = require('express');
const router = express.Router();
const Siniestro = require('../models/Siniestro');
const Inmueble = require('../models/Inmueble');
const Damnificado = require('../models/Damnificado');
const ValorCaracteristica = require('../models/ValorCaracteristica');
const TipoInmueble = require('../models/TipoInmueble');

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

      const exists = await Siniestro.findOne({ folio: reporteData.folio });
      let siniestro;
      const siniestroData = {
        folio: reporteData.folio,
        fecha: reporteData.fecha ? new Date(reporteData.fecha) : new Date(),
        ubicacion: {
          lat: reporteData.lat || 0,
          lng: reporteData.lng || 0,
          direccion: [reporteData.calle_numero, reporteData.colonia].filter(Boolean).join(', '),
          municipio: reporteData.alcaldia || '',
          estado: 'CDMX',
        },
        descripcion: reporteData.observaciones || '',
        dispositivo_id: dispositivo_id || '',
        sincronizado: true,
      };

      if (exists) {
        siniestro = await Siniestro.findByIdAndUpdate(exists._id, siniestroData, { new: true });
        await Inmueble.deleteMany({ siniestro: siniestro._id });
      } else {
        siniestro = new Siniestro(siniestroData);
        siniestro = await siniestro.save();
      }

      const inmuebleData = {
        siniestro: siniestro._id,
        tipo: 'Inmueble Genérico',
        tipo_inmueble_ref: tipoGenerico ? tipoGenerico._id : null,
        numero_niveles: reporteData.numero_niveles || 1,
        identificador: '',
        estado_afectacion: 'sin_daños',
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
          }).save();
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

      results.push(siniestro);
    }

    res.json({ message: `${results.length} reporte(s) sincronizado(s)` });
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
        fecha: s.fecha ? new Date(s.fecha).toISOString() : new Date().toISOString(),
        nombre_capturista: '',
        area: '',
        calle_numero: s.ubicacion?.direccion || '',
        colonia: '',
        alcaldia: s.ubicacion?.municipio || '',
        codigo_postal: '',
        lat: s.ubicacion?.lat || null,
        lng: s.ubicacion?.lng || null,
        uso_inmueble: '',
        otro_uso: null,
        fecha_construccion: '',
        numero_niveles: primerInmueble?.numero_niveles || 1,
        danos_observados: '',
        condicion_seguridad: '',
        observaciones: s.descripcion || '',
        fotos: '',
        valores_caracteristica: valores.map(v => ({
          caracteristica_id: v.caracteristica ? v.caracteristica.toString() : '',
          valor_texto: v.valor_texto || null,
          valor_numero: v.valor_numero || null,
          valor_booleano: v.valor_booleano == null ? null : (v.valor_booleano ? 1 : 0),
          valor_seleccion: v.valor_seleccion || null,
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

module.exports = router;
