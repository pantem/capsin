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

    const normalizarNombre = (s) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const esUso = (n) => n.includes('uso del inmueble');
    const esTipoDanio = (n) => n.includes('tipo de dano observado');
    const esNiveles = (n) => n.includes('numero de niveles sobre el terreno');
    const esSotanos = (n) => n.includes('numero de sotanos');

    const [inmuebles, todasLasCaracteristicas] = await Promise.all([
      Inmueble.find(inmuebleFilter).lean(),
      CaracteristicaTipo.find({}).select('_id nombre').lean(),
    ]);

    const caracteristicas = todasLasCaracteristicas.filter((c) => {
      const n = normalizarNombre(c.nombre);
      return esUso(n) || esTipoDanio(n) || esNiveles(n) || esSotanos(n);
    });

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
    const nivelesPorInm = new Map();
    const sotanosPorInm = new Map();
    for (const v of valores) {
      const nombre = normalizarNombre(nombrePorId.get(String(v.caracteristica)));
      const valor = v.valor_seleccion || v.valor_texto || '';
      if (esUso(nombre)) usoPorInm.set(String(v.inmueble), valor);
      else if (esTipoDanio(nombre)) danoPorInm.set(String(v.inmueble), valor);
      else if (esNiveles(nombre)) nivelesPorInm.set(String(v.inmueble), valor);
      else if (esSotanos(nombre)) sotanosPorInm.set(String(v.inmueble), valor);
    }

    const siniestroById = new Map(siniestros.map((s) => [String(s._id), s]));

    const results = [];
    for (const inm of inmuebles) {
      const s = siniestroById.get(String(inm.siniestro));
      if (!s) continue;
      const d = damnPorInm.get(String(inm._id));

      const niveles = parseInt(nivelesPorInm.get(String(inm._id)), 10);
      const sotanos = parseInt(sotanosPorInm.get(String(inm._id)), 10);
      const usaCaracteristicas = !isNaN(niveles) || !isNaN(sotanos);
      const sobreNivel = usaCaracteristicas
        ? (isNaN(niveles) ? 0 : niveles)
        : (inm.sobre_nivel_banqueta || 0);
      const bajoNivel = usaCaracteristicas
        ? (isNaN(sotanos) ? 0 : sotanos)
        : (inm.bajo_nivel_banqueta || 0);

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
        sobreNivelBanqueta: sobreNivel,
        bajoNivelBanqueta: bajoNivel,
        usoInmueble: usoPorInm.get(String(inm._id)) || '',
        tipoDanio: danoPorInm.get(String(inm._id)) || '',
        totalNiveles: sobreNivel + bajoNivel,
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
