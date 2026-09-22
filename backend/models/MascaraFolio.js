const mongoose = require('mongoose');

const mascaraFolioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, default: '' },
  formato: { type: String, required: true },
  prefijo: { type: String, default: '' },
  longitud_secuencia: { type: Number, default: 4 },
  secuencia_actual: { type: Number, default: 0 },
  aplica_a: { type: String, enum: ['siniestros', 'seguimiento', 'ambos'], default: 'ambos' },
  activo: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

mascaraFolioSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('MascaraFolio', mascaraFolioSchema);
