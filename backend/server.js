const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const siniestrosRouter = require('./routes/siniestros');
const inmueblesRouter = require('./routes/inmuebles');
const damnificadosRouter = require('./routes/damnificados');
const tiposInmuebleRouter = require('./routes/tipos_inmueble');
const caracteristicasRouter = require('./routes/caracteristicas');
const catalogosRouter = require('./routes/catalogos');
const { cargarCatalogos } = require('./seed/catalogos');
const { seedTiposInmueble } = require('./seed/tipos');
const { seedUsuarios } = require('./seed/usuarios');

const app = express();
const PORT = process.env.PORT || 4000;

const alcaldiasCDMX = [
  'Álvaro Obregón',
  'Azcapotzalco',
  'Benito Juárez',
  'Coyoacán',
  'Cuajimalpa',
  'Cuauhtémoc',
  'Gustavo A. Madero',
  'Iztacalco',
  'Iztapalapa',
  'Magdalena Contreras',
  'Miguel Hidalgo',
  'Milpa Alta',
  'Tláhuac',
  'Tlalpan',
  'Venustiano Carranza',
  'Xochimilco',
];

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

app.use('/api/siniestros', siniestrosRouter);
app.use('/api/inmuebles', inmueblesRouter);
app.use('/api/damnificados', damnificadosRouter);
app.use('/api/tipos-inmueble', tiposInmuebleRouter);
app.use('/api/caracteristicas', caracteristicasRouter);
app.use('/api', catalogosRouter);
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/valores-caracteristica', require('./routes/valores_caracteristica'));
app.use('/api/ubicacion', require('./routes/ubicacion'));
app.use('/api/inmuebles-padron', require('./routes/inmuebles_padron'));
app.use('/api/reportes-seguimiento', require('./routes/reportes_seguimiento'));
app.use('/api/mascaras-folio', require('./routes/mascaras_folio'));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/resumen', async (req, res) => {
  try {
    const Siniestro = require('./models/Siniestro');
    const Inmueble = require('./models/Inmueble');
    const Damnificado = require('./models/Damnificado');

    const totalSiniestros = await Siniestro.countDocuments();
    const totalInmuebles = await Inmueble.countDocuments();
    const totalDamnificados = await Damnificado.countDocuments();
    const fallecidos = await Damnificado.countDocuments({ estado: 'fallecido' });
    const lesionadosGrave = await Damnificado.countDocuments({ estado: 'lesionado_grave' });
    const lesionadosLeve = await Damnificado.countDocuments({ estado: 'lesionado_leve' });
    const ilesos = await Damnificado.countDocuments({ estado: 'ileso' });
    const inmueblesCriticos = await Inmueble.countDocuments({ estado_afectacion: 'critico' });
    const inmueblesModerados = await Inmueble.countDocuments({ estado_afectacion: 'moderado' });
    const inmueblesSinDanos = await Inmueble.countDocuments({ estado_afectacion: 'sin_daños' });

    const CodigoPostal = require('./models/CodigoPostal');

    const inmueblesConSiniestro = await Inmueble.find().populate('siniestro').lean();
    const allCPs = await CodigoPostal.find().lean();
    const cpMap = {};
    allCPs.forEach((c) => {
      if (c.codigo) cpMap[c.codigo] = c.municipio;
    });

    const normalize = (s) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const porAlcaldiaMap = {};
    alcaldiasCDMX.forEach((a) => {
      porAlcaldiaMap[a] = { sinDano: 0, moderado: 0, critico: 0, total: 0 };
    });

    for (const inm of inmueblesConSiniestro) {
      const s = inm.siniestro;
      if (!s) continue;

      let alcFound = null;
      const mun = s.ubicacion?.municipio || '';
      const cp = s.ubicacion?.codigo_postal || '';
      const dir = s.ubicacion?.direccion || '';

      // Direct match
      for (const a of alcaldiasCDMX) {
        const aN = normalize(a);
        const mN = normalize(mun);
        if (mN && mN !== 'ciudad de mexico' && mN !== 'cdmx' && (mN === aN || mN.includes(aN) || aN.includes(mN))) {
          alcFound = a;
          break;
        }
      }

      // CP lookup
      if (!alcFound && cp && cpMap[cp]) {
        const cpMun = normalize(cpMap[cp]);
        for (const a of alcaldiasCDMX) {
          const aN = normalize(a);
          if (cpMun.includes(aN) || aN.includes(cpMun)) {
            alcFound = a;
            break;
          }
        }
      }

      // Address match
      if (!alcFound && dir) {
        const dirN = normalize(dir);
        for (const a of alcaldiasCDMX) {
          if (dirN.includes(normalize(a))) {
            alcFound = a;
            break;
          }
        }
      }

      if (!alcFound) alcFound = 'Cuauhtémoc';

      const st = inm.estado_afectacion || 'sin_daños';
      if (st === 'sin_daños') porAlcaldiaMap[alcFound].sinDano++;
      else if (st === 'moderado') porAlcaldiaMap[alcFound].moderado++;
      else if (st === 'critico') porAlcaldiaMap[alcFound].critico++;
      porAlcaldiaMap[alcFound].total++;
    }

    const porAlcaldia = alcaldiasCDMX.map((alc) => ({
      alcaldia: alc,
      sinDano: porAlcaldiaMap[alc].sinDano,
      moderado: porAlcaldiaMap[alc].moderado,
      critico: porAlcaldiaMap[alc].critico,
      total: porAlcaldiaMap[alc].total,
    }));

    res.json({
      totalSiniestros,
      totalInmuebles,
      totalDamnificados,
      fallecidos,
      lesionadosGrave,
      lesionadosLeve,
      ilesos,
      inmueblesCriticos,
      inmueblesModerados,
      inmueblesSinDanos,
      porAlcaldia,
      ultimaActualizacion: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resumen/alcaldia-detalle', async (req, res) => {
  try {
    const Siniestro = require('./models/Siniestro');
    const Inmueble = require('./models/Inmueble');
    const CodigoPostal = require('./models/CodigoPostal');

    const { alcaldia, dano } = req.query;
    if (!alcaldia) return res.status(400).json({ error: 'alcaldia requerida' });

    const normalize = (s) =>
      (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const allCPs = await CodigoPostal.find().lean();
    const cpMap = {};
    allCPs.forEach((c) => { if (c.codigo) cpMap[c.codigo] = c.municipio; });

    const inmueblesConSiniestro = await Inmueble.find().populate('siniestro').lean();
    const results = [];

    for (const inm of inmueblesConSiniestro) {
      const s = inm.siniestro;
      if (!s) continue;

      let alcFound = null;
      const mun = s.ubicacion?.municipio || '';
      const cp = s.ubicacion?.codigo_postal || '';
      const dir = s.ubicacion?.direccion || '';

      for (const a of alcaldiasCDMX) {
        const aN = normalize(a);
        const mN = normalize(mun);
        if (mN && mN !== 'ciudad de mexico' && mN !== 'cdmx' && (mN === aN || mN.includes(aN) || aN.includes(mN))) {
          alcFound = a;
          break;
        }
      }
      if (!alcFound && cp && cpMap[cp]) {
        const cpMun = normalize(cpMap[cp]);
        for (const a of alcaldiasCDMX) {
          const aN = normalize(a);
          if (cpMun.includes(aN) || aN.includes(cpMun)) { alcFound = a; break; }
        }
      }
      if (!alcFound && dir) {
        const dirN = normalize(dir);
        for (const a of alcaldiasCDMX) {
          if (dirN.includes(normalize(a))) { alcFound = a; break; }
        }
      }
      if (!alcFound) alcFound = 'Cuauhtémoc';

      if (alcFound !== alcaldia) continue;
      if (dano && inm.estado_afectacion !== dano) continue;

      results.push({
        siniestroId: s._id.toString(),
        folio: s.folio || '',
        fecha: s.fecha,
        direccion: s.ubicacion?.direccion || '',
        tipo: inm.tipo || '',
        estadoAfectacion: inm.estado_afectacion || 'sin_daños',
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mapa', async (req, res) => {
  try {
    const Siniestro = require('./models/Siniestro');
    const Inmueble = require('./models/Inmueble');
    const Damnificado = require('./models/Damnificado');

    const siniestros = await Siniestro.find().sort({ fecha: -1 }).lean();
    const results = [];

    for (const s of siniestros) {
      const inmuebles = await Inmueble.find({ siniestro: s._id }).lean();
      let totalDamnificados = 0;
      let fallecidos = 0;
      let lesionadosGrave = 0;
      let lesionadosLeve = 0;
      let ilesos = 0;

      let peorEstado = 'sin_daños';
      for (const inm of inmuebles) {
        const ea = inm.estado_afectacion || 'sin_daños';
        if (ea === 'critico') peorEstado = 'critico';
        else if (ea === 'moderado' && peorEstado !== 'critico') peorEstado = 'moderado';

        const damns = await Damnificado.find({ inmueble: inm._id }).lean();
        totalDamnificados += damns.length;
        for (const d of damns) {
          if (d.estado === 'fallecido') fallecidos++;
          else if (d.estado === 'lesionado_grave') lesionadosGrave++;
          else if (d.estado === 'lesionado_leve') lesionadosLeve++;
          else if (d.estado === 'ileso') ilesos++;
        }
      }

      const color = peorEstado === 'critico' ? 'red' : peorEstado === 'moderado' ? 'yellow' : 'green';

      results.push({
        _id: s._id,
        folio: s.folio,
        fecha: s.fecha,
        ubicacion: s.ubicacion,
        color,
        totalDamnificados,
        fallecidos,
        lesionadosGrave,
        lesionadosLeve,
        ilesos,
        totalInmuebles: inmuebles.length,
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

connectDB().then(async () => {
  await cargarCatalogos();
  await seedTiposInmueble();
  await seedUsuarios();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
