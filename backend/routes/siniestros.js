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
      const inmueblesData = [];

      for (const inm of inmuebles) {
        const damnificados = await Damnificado.find({ inmueble: inm._id }).lean();
        const valores = await ValorCaracteristica.find({ inmueble: inm._id }).lean();

        inmueblesData.push({
          id: inm._id.toString(),
          siniestroId: s._id.toString(),
          tipo: inm.tipo || '',
          tipoInmuebleId: inm.tipo_inmueble_ref ? inm.tipo_inmueble_ref.toString() : null,
          numeroNiveles: inm.numero_niveles || 1,
          tipoUnidad: inm.tipo_unidad || '',
          esPadre: inm.es_padre ? 1 : 0,
          padreId: inm.padre ? inm.padre.toString() : null,
          identificador: inm.identificador || '',
          estadoAfectacion: inm.estado_afectacion || 'sin_daños',
          observaciones: inm.observaciones || '',
          sincronizado: 1,
          damnificados: damnificados.map(d => ({
            id: d._id.toString(),
            inmuebleId: inm._id.toString(),
            nombre: d.nombre || '',
            edad: d.edad || 0,
            sexo: d.sexo || '',
            tipoIdentificacion: d.tipo_identificacion || '',
            numeroIdentificacion: d.numero_identificacion || '',
            estado: d.estado || 'ileso',
            requiereTraslado: d.requiere_traslado ? 1 : 0,
            observaciones: d.observaciones || '',
            sincronizado: 1,
          })),
          valores_caracteristica: valores.map(v => ({
            id: v._id.toString(),
            inmuebleId: inm._id.toString(),
            caracteristicaId: v.caracteristica ? v.caracteristica.toString() : '',
            valorTexto: v.valor_texto || null,
            valorNumero: v.valor_numero || null,
            valorBooleano: v.valor_booleano == null ? null : (v.valor_booleano ? 1 : 0),
            valorSeleccion: v.valor_seleccion || null,
          })),
        });
      }

      results.push({
        id: s._id.toString(),
        folio: s.folio,
        fecha: s.fecha ? new Date(s.fecha).toISOString() : new Date().toISOString(),
        lat: s.ubicacion?.lat || 0,
        lng: s.ubicacion?.lng || 0,
        direccion: s.ubicacion?.direccion || '',
        municipio: s.ubicacion?.municipio || '',
        estado: s.ubicacion?.estado || '',
        descripcion: s.descripcion || '',
        sincronizado: 1,
        inmuebles: inmueblesData,
      });
    }

    res.json(results);
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
    const { siniestros, tipos_inmueble, dispositivo_id } = req.body;

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
      const dataToSave = dispositivo_id
        ? { ...siniestroData, dispositivo_id, sincronizado: true }
        : { ...siniestroData, sincronizado: true };
      if (exists) {
        siniestro = await Siniestro.findByIdAndUpdate(exists._id, dataToSave, { new: true });
      } else {
        siniestro = new Siniestro(dataToSave);
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
