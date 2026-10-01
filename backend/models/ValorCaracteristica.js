const mongoose = require('mongoose');

const valorCaracteristicaSchema = new mongoose.Schema({
  inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true, index: true },
  caracteristica: { type: mongoose.Schema.Types.ObjectId, ref: 'CaracteristicaTipo', required: true, index: true },
  valor_texto: { type: String, default: null },
  valor_numero: { type: Number, default: null },
  valor_booleano: { type: Boolean, default: null },
  valor_seleccion: { type: String, default: null },
  valor_texto_condicional: { type: String, default: null },
});

module.exports = mongoose.model('ValorCaracteristica', valorCaracteristicaSchema);
