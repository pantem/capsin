const express = require('express');
const router = express.Router();
const Siniestro = require('../models/Siniestro');
const Inmueble = require('../models/Inmueble');
const Damnificado = require('../models/Damnificado');
const ValorCaracteristica = require('../models/ValorCaracteristica');
const TipoInmueble = require('../models/TipoInmueble');

router.get('/', async (req, res) => {
  try {
    const siniestros = await Siniestro.find().sort({ creado_en: -1 });
    res.json(siniestros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const siniestro = await Siniestro.findById(req.params.id);
    if (!siniestro) return res.status(404).json({ error: 'Siniestro no encontrado' });
    res.json(siniestro);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const siniestro = new Siniestro(req.body);
    const saved = await siniestro.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Siniestro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Siniestro no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const inmuebles = await Inmueble.find({ siniestro: req.params.id });
    const inmuebleIds = inmuebles.map((i) => i._id);
    await Damnificado.deleteMany({ inmueble: { $in: inmuebleIds } });
    await Inmueble.deleteMany({ siniestro: req.params.id });
    const deleted = await Siniestro.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Siniestro no encontrado' });
    res.json({ message: 'Siniestro y todos sus datos eliminados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const { siniestros, tipos_inmueble } = req.body;

    if (tipos_inmueble) {
      for (const t of tipos_inmueble) {
        await TipoInmueble.findOneAndUpdate(
          { nombre: t.nombre },
          { $setOnInsert: { nombre: t.nombre, descripcion: t.descripcion || '' } },
          { upsert: true }
        );
      }
    }

    const results = [];
    for (const item of siniestros) {
      const { inmuebles, ...siniestroData } = item;
      const exists = await Siniestro.findOne({ folio: siniestroData.folio });
      let siniestro;
      if (exists) {
        siniestro = await Siniestro.findByIdAndUpdate(exists._id, siniestroData, { new: true });
      } else {
        siniestro = new Siniestro({ ...siniestroData, sincronizado: true });
        siniestro = await siniestro.save();
      }
      if (inmuebles) {
        for (const inmData of inmuebles) {
          const { valores_caracteristica, damnificados, ...inmuebleData } = inmData;
          const inmueble = new Inmueble({ ...inmuebleData, siniestro: siniestro._id, sincronizado: true });
          const savedInm = await inmueble.save();
          if (valores_caracteristica) {
            for (const valData of valores_caracteristica) {
              const valor = new ValorCaracteristica({ ...valData, inmueble: savedInm._id });
              await valor.save();
            }
          }
          if (damnificados) {
            for (const damData of damnificados) {
              const damnificado = new Damnificado({ ...damData, inmueble: savedInm._id, sincronizado: true });
              await damnificado.save();
            }
          }
        }
      }
      results.push(siniestro);
    }
    res.json({ message: `${results.length} siniestros sincronizados`, siniestros: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
