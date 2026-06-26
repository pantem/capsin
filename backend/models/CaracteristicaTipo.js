const mongoose = require('mongoose');

const caracteristicaTipoSchema = new mongoose.Schema({
  tipo_inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoInmueble', required: true },
  nombre: { type: String, required: true },
  tipo_dato: { type: String, enum: ['texto', 'numero', 'booleano', 'seleccion', 'multiseleccion'], required: true },
  opciones: { type: [String], default: [] },
  requerido: { type: Boolean, default: false },
  orden: { type: Number, default: 0 },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

caracteristicaTipoSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('CaracteristicaTipo', caracteristicaTipoSchema);
