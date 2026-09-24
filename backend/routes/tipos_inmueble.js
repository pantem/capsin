const express = require('express');
const router = express.Router();
const TipoInmueble = require('../models/TipoInmueble');
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.activos === 'true') filter.activo = true;
    const tipos = await TipoInmueble.find(filter).sort({ nombre: 1 });
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const tipo = new TipoInmueble(req.body);
    const saved = await tipo.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tipo = await TipoInmueble.findById(req.params.id);
    if (!tipo) return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json(tipo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await TipoInmueble.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await CaracteristicaTipo.deleteMany({ tipo_inmueble: req.params.id });
    const deleted = await TipoInmueble.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json({ message: 'Tipo y sus características eliminados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/caracteristicas', async (req, res) => {
  try {
    const caracteristicas = await CaracteristicaTipo.find({ tipo_inmueble: req.params.id }).sort({ orden: 1 });
    res.json(caracteristicas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/caracteristicas', async (req, res) => {
  try {
    await CaracteristicaTipo.deleteMany({ tipo_inmueble: req.params.id });
    res.json({ message: 'Características eliminadas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/caracteristicas', async (req, res) => {
  try {
    const tipoId = req.params.id;
    const incoming = req.body.caracteristicas;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ error: 'caracteristicas requerido' });
    }

    const existentes = await CaracteristicaTipo.find({ tipo_inmueble: tipoId });
    const existentesMap = new Map(existentes.map(c => [c.nombre, c]));
    const incomingNames = new Set(incoming.map(c => c.nombre));

    for (let i = 0; i < incoming.length; i++) {
      const c = incoming[i];
      const existente = existentesMap.get(c.nombre);
      if (existente) {
        await CaracteristicaTipo.findByIdAndUpdate(existente._id, {
          tipo_dato: c.tipo_dato,
          opciones: c.opciones || [],
          requerido: c.requerido,
          orden: i,
          minimo: c.minimo ?? null,
          maximo: c.maximo ?? null,
        });
      } else {
        await new CaracteristicaTipo({
          tipo_inmueble: tipoId,
          nombre: c.nombre,
          tipo_dato: c.tipo_dato,
          opciones: c.opciones || [],
          requerido: c.requerido,
          orden: i,
          minimo: c.minimo ?? null,
          maximo: c.maximo ?? null,
        }).save();
      }
    }

    for (const e of existentes) {
      if (!incomingNames.has(e.nombre)) {
        await CaracteristicaTipo.findByIdAndDelete(e._id);
      }
    }

    const result = await CaracteristicaTipo.find({ tipo_inmueble: tipoId }).sort({ orden: 1 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/caracteristicas', async (req, res) => {
  try {
    const caracteristica = new CaracteristicaTipo({ ...req.body, tipo_inmueble: req.params.id });
    const saved = await caracteristica.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
