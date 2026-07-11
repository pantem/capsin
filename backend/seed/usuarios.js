const Usuario = require('../models/Usuario');
const Area = require('../models/Area');
const Rol = require('../models/Rol');

const AREAS_DEFAULT = [
  { nombre: 'Protección Civil', descripcion: 'Protección Civil' },
  { nombre: 'Bomberos', descripcion: 'Cuerpo de Bomberos' },
  { nombre: 'Cruz Roja', descripcion: 'Cruz Roja Mexicana' },
  { nombre: 'Seguridad Pública', descripcion: 'Seguridad Pública' },
  { nombre: 'Salud', descripcion: 'Secretaría de Salud' },
  { nombre: 'Educación', descripcion: 'Secretaría de Educación' },
  { nombre: 'Otro', descripcion: 'Otra área' },
];

const ROLES_DEFAULT = [
  {
    nombre: 'admin',
    descripcion: 'Acceso total al sistema',
    permisos: ['ver_dashboard', 'ver_mapa', 'ver_lista', 'ver_catalogo', 'ver_usuarios', 'ver_tipos', 'ver_areas', 'ver_roles'],
  },
  {
    nombre: 'capturista',
    descripcion: 'Captura y consulta de reportes',
    permisos: ['ver_dashboard', 'ver_mapa', 'ver_lista', 'ver_catalogo'],
  },
  {
    nombre: 'visor',
    descripcion: 'Solo consulta de reportes',
    permisos: ['ver_dashboard', 'ver_mapa', 'ver_lista'],
  },
];

async function seedAreas() {
  const created = [];
  for (const a of AREAS_DEFAULT) {
    let area = await Area.findOne({ nombre: a.nombre });
    if (!area) {
      area = await new Area(a).save();
      console.log(`Área creada: ${a.nombre}`);
    }
    created.push(area);
  }
  return created;
}

async function seedRoles() {
  const created = [];
  for (const r of ROLES_DEFAULT) {
    let rol = await Rol.findOne({ nombre: r.nombre });
    if (!rol) {
      rol = await new Rol(r).save();
      console.log(`Rol creado: ${r.nombre}`);
    }
    created.push(rol);
  }
  return created;
}

async function seedUsuarios() {
  const areas = await seedAreas();
  const roles = await seedRoles();

  const areaAdmin = areas.find(a => a.nombre === 'Protección Civil');
  const rolAdmin = roles.find(r => r.nombre === 'admin');

  const adminUser = await Usuario.findOne({ username: 'admin' });
  if (!adminUser) {
    await new Usuario({
      nombre: 'Administrador',
      username: 'admin',
      password: 'admin123',
      area: areaAdmin ? areaAdmin._id : null,
      rol: rolAdmin ? rolAdmin._id : null,
      activo: true,
    }).save();
    console.log('Usuario admin creado');
  } else {
    const updates = {};
    if (areaAdmin) updates.area = areaAdmin._id;
    if (rolAdmin) updates.rol = rolAdmin._id;
    await Usuario.updateOne({ username: 'admin' }, { $set: updates });
    console.log('Usuario admin actualizado');
  }

  const allUsers = await Usuario.find({}).lean();

  for (const u of allUsers) {
    const updates = {};

    if (u.area && typeof u.area === 'string') {
      const areaDoc = areas.find(a => a.nombre === u.area);
      if (areaDoc) {
        updates.area = areaDoc._id;
      }
    }

    if (u.rol && typeof u.rol === 'string') {
      const rolDoc = roles.find(r => r.nombre === u.rol);
      if (rolDoc) {
        updates.rol = rolDoc._id;
      }
    }

    if (Object.keys(updates).length > 0) {
      await Usuario.updateOne({ _id: u._id }, { $set: updates });
      console.log(`Usuario migrado: ${u.username || u._id}`);
    }
  }
}

module.exports = { seedUsuarios };
