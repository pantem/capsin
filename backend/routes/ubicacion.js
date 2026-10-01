const express = require('express');
const router = express.Router();
const Siniestro = require('../models/Siniestro');
const Inmueble = require('../models/Inmueble');
const Damnificado = require('../models/Damnificado');
const ValorCaracteristica = require('../models/ValorCaracteristica');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

router.get('/', async (req, res) => {
  try {
    const { alcaldia, colonia, cp, dano } = req.query;

    const siniestroFilter = {};
    if (alcaldia) siniestroFilter['ubicacion.municipio'] = alcaldia;
    if (colonia) siniestroFilter['ubicacion.direccion'] = { $regex: colonia, $options: 'i' };
    if (cp) siniestroFilter['ubicacion.codigo_postal'] = cp;

    const siniestros = await Siniestro.find(siniestroFilter).sort({ fecha: -1 }).lean();
    const siniestroIds = siniestros.map((s) => s._id);
    if (siniestroIds.length === 0) return res.json([]);

    const inmuebleFilter = { siniestro: { $in: siniestroIds } };
    if (dano) inmuebleFilter.estado_afectacion = dano;

    const [inmuebles, caracteristicas] = await Promise.all([
      Inmueble.find(inmuebleFilter).lean(),
      CaracteristicaTipo.find({
        nombre: { $in: ['Uso del Inmueble', 'Tipo de daño observado'] },
      })
        .select('_id nombre')
        .lean(),
    ]);

    const ordenSiniestro = new Map(siniestros.map((s, i) => [String(s._id), i]));
    inmuebles.sort(
      (a, b) =>
        (ordenSiniestro.get(String(a.siniestro)) ?? 0) -
        (ordenSiniestro.get(String(b.siniestro)) ?? 0)
    );

    const inmIds = inmuebles.map((i) => i._id);
    const carIds = caracteristicas.map((c) => c._id);
    const nombrePorId = new Map(caracteristicas.map((c) => [String(c._id), c.nombre]));

    const [agrupados, valores] = await Promise.all([
      inmIds.length
        ? Damnificado.aggregate([
            { $match: { inmueble: { $in: inmIds } } },
            {
              $group: {
                _id: '$inmueble',
                total: { $sum: 1 },
                fallecidos: {
                  $sum: { $cond: [{ $eq: ['$estado', 'fallecido'] }, 1, 0] },
                },
                lesionadosGrave: {
                  $sum: { $cond: [{ $eq: ['$estado', 'lesionado_grave'] }, 1, 0] },
                },
                lesionadosLeve: {
                  $sum: { $cond: [{ $eq: ['$estado', 'lesionado_leve'] }, 1, 0] },
                },
              },
            },
          ])
        : Promise.resolve([]),
      inmIds.length && carIds.length
        ? ValorCaracteristica.find({ inmueble: { $in: inmIds }, caracteristica: { $in: carIds } })
            .select('inmueble caracteristica valor_seleccion valor_texto')
            .lean()
        : Promise.resolve([]),
    ]);

    const damnPorInm = new Map(agrupados.map((g) => [String(g._id), g]));
    const usoPorInm = new Map();
    const danoPorInm = new Map();
    for (const v of valores) {
      const nombre = nombrePorId.get(String(v.caracteristica)) || '';
      const valor = v.valor_seleccion || v.valor_texto || '';
      if (nombre === 'Uso del Inmueble') usoPorInm.set(String(v.inmueble), valor);
      else if (nombre === 'Tipo de daño observado') danoPorInm.set(String(v.inmueble), valor);
    }

    const siniestroById = new Map(siniestros.map((s) => [String(s._id), s]));

    const results = [];
    for (const inm of inmuebles) {
      const s = siniestroById.get(String(inm.siniestro));
      if (!s) continue;
      const d = damnPorInm.get(String(inm._id));

      results.push({
        siniestroId: s._id.toString(),
        folio: s.folio || '',
        fecha: s.fecha,
        direccion: s.ubicacion?.direccion || '',
        alcaldia: s.ubicacion?.municipio || '',
        codigoPostal: s.ubicacion?.codigo_postal || '',
        estado: s.ubicacion?.estado || '',
        lat: s.ubicacion?.lat || null,
        lng: s.ubicacion?.lng || null,
        inmuebleId: inm._id.toString(),
        tipo: inm.tipo || '',
        estadoAfectacion: inm.estado_afectacion || 'sin_daños',
        sobreNivelBanqueta: inm.sobre_nivel_banqueta || 0,
        bajoNivelBanqueta: inm.bajo_nivel_banqueta || 0,
        usoInmueble: usoPorInm.get(String(inm._id)) || '',
        tipoDanio: danoPorInm.get(String(inm._id)) || '',
        totalNiveles: (inm.sobre_nivel_banqueta || 0) + (inm.bajo_nivel_banqueta || 0),
        totalDamnificados: d ? d.total : 0,
        fallecidos: d ? d.fallecidos : 0,
        lesionadosGrave: d ? d.lesionadosGrave : 0,
        lesionadosLeve: d ? d.lesionadosLeve : 0,
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/filtros', async (req, res) => {
  try {
    const [alcaldias, colonias, codigosPostales] = await Promise.all([
      Siniestro.distinct('ubicacion.municipio'),
      Siniestro.distinct('ubicacion.direccion'),
      Siniestro.distinct('ubicacion.codigo_postal'),
    ]);

    const limpiar = (arr) => [...new Set((arr || []).filter(Boolean))].sort();

    res.json({
      alcaldias: limpiar(alcaldias),
      colonias: limpiar(colonias),
      codigosPostales: limpiar(codigosPostales),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
