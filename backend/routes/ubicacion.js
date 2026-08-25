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

    const results = [];
    for (const s of siniestros) {
      const inmuebleFilter = { siniestro: s._id };
      if (dano) inmuebleFilter.estado_afectacion = dano;

      const inmuebles = await Inmueble.find(inmuebleFilter).lean();
      for (const inm of inmuebles) {
        const damnificados = await Damnificado.find({ inmueble: inm._id }).lean();
        const valores = await ValorCaracteristica.find({ inmueble: inm._id })
          .populate('caracteristica', 'nombre tipo_dato')
          .lean();

        let usoInmueble = '';
        let tipoDanio = '';
        for (const v of valores) {
          const nombre = v.caracteristica?.nombre || '';
          if (nombre === 'Uso del Inmueble') usoInmueble = v.valor_seleccion || v.valor_texto || '';
          if (nombre === 'Tipo de daño observado') tipoDanio = v.valor_seleccion || v.valor_texto || '';
        }

        let totalDamnificados = damnificados.length;
        let fallecidos = damnificados.filter(d => d.estado === 'fallecido').length;
        let lesionadosGrave = damnificados.filter(d => d.estado === 'lesionado_grave').length;
        let lesionadosLeve = damnificados.filter(d => d.estado === 'lesionado_leve').length;

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
          usoInmueble,
          tipoDanio,
          totalNiveles: (inm.sobre_nivel_banqueta || 0) + (inm.bajo_nivel_banqueta || 0),
          totalDamnificados,
          fallecidos,
          lesionadosGrave,
          lesionadosLeve,
        });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/filtros', async (req, res) => {
  try {
    const siniestros = await Siniestro.find().lean();
    const alcaldias = [...new Set(siniestros.map(s => s.ubicacion?.municipio).filter(Boolean))].sort();
    const colonias = [...new Set(siniestros.map(s => s.ubicacion?.direccion).filter(Boolean))].sort();
    const codigosPostales = [...new Set(siniestros.map(s => s.ubicacion?.codigo_postal).filter(Boolean))].sort();

    res.json({ alcaldias, colonias, codigosPostales });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
