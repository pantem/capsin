const express = require('express');
const router = express.Router();
const InmueblePadron = require('../models/InmueblePadron');
const ReporteSeguimiento = require('../models/ReporteSeguimiento');
const ValorCaracteristicaSeguimiento = require('../models/ValorCaracteristicaSeguimiento');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.colonia) filter.colonia = new RegExp(req.query.colonia, 'i');
    if (req.query.alcaldia) filter.alcaldia = new RegExp(req.query.alcaldia, 'i');
    if (req.query.codigo_postal) filter.codigo_postal = req.query.codigo_postal;
    if (req.query.activo !== undefined) filter.activo = req.query.activo === 'true';
    const inmuebles = await InmueblePadron.find(filter).sort({ creado_en: -1 });
    res.json(inmuebles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cercanos', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radio = parseInt(req.query.radio) || 1000;
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Se requieren lat y lng' });
    }
    const inmuebles = await InmueblePadron.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distancia',
          maxDistance: radio,
          spherical: true,
          query: { activo: true },
        },
      },
      { $sort: { distancia: 1 } },
    ]);
    res.json(inmuebles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inmueble = await InmueblePadron.findById(req.params.id);
    if (!inmueble) return res.status(404).json({ error: 'Inmueble no encontrado' });
    res.json(inmueble);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/reportes', async (req, res) => {
  try {
    const reportes = await ReporteSeguimiento.find({ inmueble_padron: req.params.id })
      .sort({ fecha: -1 });
    res.json(reportes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.lat != null && data.lng != null) {
      data.ubicacion = {
        type: 'Point',
        coordinates: [parseFloat(data.lng), parseFloat(data.lat)],
      };
      delete data.lat;
      delete data.lng;
    }
    const inmueble = new InmueblePadron(data);
    const saved = await inmueble.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.lat != null && data.lng != null) {
      data.ubicacion = {
        type: 'Point',
        coordinates: [parseFloat(data.lng), parseFloat(data.lat)],
      };
      delete data.lat;
      delete data.lng;
    }
    const updated = await InmueblePadron.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!updated) return res.status(404).json({ error: 'Inmueble no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ValorCaracteristicaSeguimiento.deleteMany({ reporte_seguimiento: { $in: await ReporteSeguimiento.find({ inmueble_padron: req.params.id }).distinct('_id') } });
    await ReporteSeguimiento.deleteMany({ inmueble_padron: req.params.id });
    const deleted = await InmueblePadron.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Inmueble no encontrado' });
    res.json({ message: 'Inmueble y dependencias eliminados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
