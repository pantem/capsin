const mongoose = require('mongoose');

const inmueblePadronSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo_inmueble_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoInmueble', default: null },
  direccion: { type: String, default: '' },
  colonia: { type: String, default: '' },
  alcaldia: { type: String, default: '' },
  codigo_postal: { type: String, default: '' },
  entre_calles: { type: String, default: '' },
  persona_contactada: { type: String, default: '' },
  decada_construccion: { type: String, default: '' },
  uso_inmueble: { type: String, default: '' },
  niveles: { type: Number, default: 1 },
  sotanos: { type: Number, default: 0 },
  ocupantes: { type: Number, default: 0 },
  tipo_inspeccion: { type: String, default: '' },
  ubicacion: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  estado_afectacion: { type: String, enum: ['sin_daños', 'moderado', 'critico'], default: 'sin_daños' },
  fecha_ultimo_reporte: { type: Date, default: null },
  activo: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

inmueblePadronSchema.index({ ubicacion: '2dsphere' });
inmueblePadronSchema.index({ colonia: 1 });
inmueblePadronSchema.index({ alcaldia: 1 });
inmueblePadronSchema.index({ codigo_postal: 1 });

inmueblePadronSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('InmueblePadron', inmueblePadronSchema);
