const mongoose = require('mongoose');

const reporteSeguimientoSchema = new mongoose.Schema({
  inmueble_padron: { type: mongoose.Schema.Types.ObjectId, ref: 'InmueblePadron', required: true },
  capturista: { type: String, default: '' },
  fecha: { type: Date, default: Date.now },
  clasificacion_global: { type: String, default: '' },
  observaciones: { type: String, default: '' },
  fotos: { type: String, default: '' },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

reporteSeguimientoSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('ReporteSeguimiento', reporteSeguimientoSchema);
