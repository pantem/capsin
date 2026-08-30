const express = require('express');
const router = express.Router();
const ReporteSeguimiento = require('../models/ReporteSeguimiento');
const ValorCaracteristicaSeguimiento = require('../models/ValorCaracteristicaSeguimiento');
const InmueblePadron = require('../models/InmueblePadron');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.inmueble) filter.inmueble_padron = req.query.inmueble;
    const reportes = await ReporteSeguimiento.find(filter)
      .populate('inmueble_padron')
      .sort({ fecha: -1 });
    res.json(reportes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reporte = await ReporteSeguimiento.findById(req.params.id)
      .populate('inmueble_padron');
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
    const valores = await ValorCaracteristicaSeguimiento.find({ reporte_seguimiento: reporte._id })
      .populate('caracteristica');
    res.json({ ...reporte.toObject(), valores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { inmueble_padron, valores_caracteristica, ...reporteData } = req.body;

    const horasLimite = 24;
    const fechaLimite = new Date(Date.now() - horasLimite * 60 * 60 * 1000);
    const existente = await ReporteSeguimiento.findOne({
      inmueble_padron,
      fecha: { $gte: fechaLimite },
    }).sort({ fecha: -1 });

    if (existente) {
      return res.json({
        duplicado: true,
        reporte_existente: existente,
        mensaje: `Este inmueble ya tiene un reporte reciente (${new Date(existente.fecha).toLocaleString()})`,
      });
    }

    const reporte = new ReporteSeguimiento({ ...reporteData, inmueble_padron });
    const saved = await reporte.save();

    if (valores_caracteristica && valores_caracteristica.length > 0) {
      for (const v of valores_caracteristica) {
        await new ValorCaracteristicaSeguimiento({
          reporte_seguimiento: saved._id,
          caracteristica: v.caracteristica,
          valor_texto: v.valor_texto,
          valor_numero: v.valor_numero,
          valor_booleano: v.valor_booleano,
          valor_seleccion: v.valor_seleccion,
        }).save();
      }
    }

    let clasificacion = '';
    if (valores_caracteristica) {
      const respuestasSi = [];
      for (const v of valores_caracteristica) {
        if (v.valor_seleccion === 'Sí') {
          const caract = await require('../models/CaracteristicaTipo').findById(v.caracteristica);
          if (caract) respuestasSi.push(caract.nombre);
        }
      }
      const riesgoAlto = respuestasSi.some(r => /^2\.[1-8]/.test(r));
      const riesgoMedio = respuestasSi.some(r => /^2\.[9-p]/.test(r) || r.startsWith('2.9') || r.startsWith('2.10') || r.startsWith('2.11') || r.startsWith('2.12') || r.startsWith('2.13') || r.startsWith('2.14') || r.startsWith('2.15') || r.startsWith('2.16'));
      const existenDudas = valores_caracteristica.some(v => v.valor_seleccion === 'Existen dudas');

      if (riesgoAlto) clasificacion = 'Edificación en Riesgo Alto';
      else if (riesgoMedio) clasificacion = 'Área Insegura o Edificación en Riesgo Medio';
      else if (existenDudas) clasificacion = 'Seguridad Incierta';
      else clasificacion = 'Edificación en Riesgo Bajo';

      await ReporteSeguimiento.findByIdAndUpdate(saved._id, { clasificacion_global: clasificacion });
    }

    await InmueblePadron.findByIdAndUpdate(inmueble_padron, {
      fecha_ultimo_reporte: new Date(),
    });

    res.status(201).json({ duplicado: false, reporte: saved, clasificacion });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ValorCaracteristicaSeguimiento.deleteMany({ reporte_seguimiento: req.params.id });
    const deleted = await ReporteSeguimiento.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json({ message: 'Reporte eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
