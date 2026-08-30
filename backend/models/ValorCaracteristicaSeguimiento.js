const mongoose = require('mongoose');

const valorCaracteristicaSeguimientoSchema = new mongoose.Schema({
  reporte_seguimiento: { type: mongoose.Schema.Types.ObjectId, ref: 'ReporteSeguimiento', required: true },
  caracteristica: { type: mongoose.Schema.Types.ObjectId, ref: 'CaracteristicaTipo', required: true },
  valor_texto: { type: String, default: null },
  valor_numero: { type: Number, default: null },
  valor_booleano: { type: Boolean, default: null },
  valor_seleccion: { type: String, default: null },
  creado_en: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ValorCaracteristicaSeguimiento', valorCaracteristicaSeguimientoSchema);
