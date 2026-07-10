const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  area: { type: String, default: '' },
  rol: { type: String, enum: ['admin', 'capturista', 'visor'], default: 'capturista' },
  activo: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
});

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
