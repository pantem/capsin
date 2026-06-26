const mongoose = require('mongoose');

const siniestroSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  fecha: { type: Date, default: Date.now },
  ubicacion: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    direccion: { type: String, default: '' },
    municipio: { type: String, default: '' },
    estado: { type: String, default: '' },
  },
  descripcion: { type: String, default: '' },
  dispositivo_id: { type: String, default: null, index: true },
  sincronizado: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
  actualizado_en: { type: Date, default: Date.now },
});

siniestroSchema.pre('save', function (next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('Siniestro', siniestroSchema);
