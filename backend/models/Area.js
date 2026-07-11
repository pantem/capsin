const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, default: '' },
  activo: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Area', areaSchema);
