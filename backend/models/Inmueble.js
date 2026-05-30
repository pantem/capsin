const mongoose = require('mongoose');

const inmuebleSchema = new mongoose.Schema({
  siniestro: { type: mongoose.Schema.Types.ObjectId, ref: 'Siniestro', required: true },
  tipo: { type: String, default: '' },
  tipo_inmueble_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoInmueble', default: null },
  numero_niveles: { type: Number, default: 1 },
  tipo_unidad: { type: String, default: '' },
  es_padre: { type: Boolean, default: false },
  padre: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', default: null },
  identificador: { type: String, default: '' },
  estado_afectacion: { type: String, enum: ['critico', 'moderado', 'sin_daños'], default: 'sin_daños' },
  observaciones: { type: String, default: '' },
  sincronizado: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

inmuebleSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('Inmueble', inmuebleSchema);
