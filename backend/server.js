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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mapa', async (req, res) => {
  try {
    const Siniestro = require('./models/Siniestro');
    const Inmueble = require('./models/Inmueble');
    const Damnificado = require('./models/Damnificado');

    const siniestros = await Siniestro.find().lean();
    const results = [];

    for (const s of siniestros) {
      const inmuebles = await Inmueble.find({ siniestro: s._id }).lean();
      let totalDamnificados = 0;
      let fallecidos = 0;
      let lesionadosGrave = 0;
      let lesionadosLeve = 0;
      let ilesos = 0;

      for (const inm of inmuebles) {
        const damns = await Damnificado.find({ inmueble: inm._id }).lean();
        totalDamnificados += damns.length;
        for (const d of damns) {
          if (d.estado === 'fallecido') fallecidos++;
          else if (d.estado === 'lesionado_grave') lesionadosGrave++;
          else if (d.estado === 'lesionado_leve') lesionadosLeve++;
          else if (d.estado === 'ileso') ilesos++;
        }
      }

      let color = 'green';
      if (fallecidos > 0 || lesionadosGrave > 0) {
        color = 'red';
      } else if (lesionadosLeve > 0) {
        color = 'yellow';
      }

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
