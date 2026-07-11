const mongoose = require('mongoose');

const PERMISOS_DISPONIBLES = [
  'ver_dashboard',
  'ver_mapa',
  'ver_lista',
  'ver_catalogo',
  'ver_usuarios',
  'ver_tipos',
  'ver_areas',
  'ver_roles',
];

const rolSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, default: '' },
  permisos: [{ type: String, enum: PERMISOS_DISPONIBLES }],
  activo: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rol', rolSchema);
module.exports.PERMISOS_DISPONIBLES = PERMISOS_DISPONIBLES;
