const mongoose = require('mongoose');

const codigoPostalSchema = new mongoose.Schema({
  codigo: { type: String, required: true, index: true },
  colonia: { type: String, required: true },
  tipo_asentamiento: { type: String, default: 'Colonia' },
  municipio: { type: String, required: true },
  estado: { type: String, required: true },
});

codigoPostalSchema.index({ codigo: 1, colonia: 1 });

module.exports = mongoose.model('CodigoPostal', codigoPostalSchema);
