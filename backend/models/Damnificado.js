const mongoose = require('mongoose');

const damnificadoSchema = new mongoose.Schema({
  inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true },
  nombre: { type: String, default: '' },
  edad: { type: Number, default: 0 },
  sexo: { type: String, enum: ['M', 'F', ''] },
  tipo_identificacion: { type: String, default: '' },
  numero_identificacion: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['fallecido', 'lesionado_grave', 'lesionado_leve', 'ileso'],
    default: 'ileso',
  },
  requiere_traslado: { type: Boolean, default: false },
  observaciones: { type: String, default: '' },
  sincronizado: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

damnificadoSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('Damnificado', damnificadoSchema);
