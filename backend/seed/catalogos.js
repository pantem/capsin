const fs = require('fs');
const path = require('path');
const CodigoPostal = require('../models/CodigoPostal');

const JSON_PATH = path.join(__dirname, 'codigos_cdmx.json');
const EXCEL_PATH = 'C:\\sepomex\\codigos.xls';

function leerDesdeExcel() {
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets['Distrito_Federal'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const docs = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !row[0]) continue;
    docs.push({
      codigo: String(row[0]).padStart(5, '0'),
      colonia: (row[1] || '').trim(),
      tipo_asentamiento: (row[2] || 'Colonia').trim(),
      municipio: (row[3] || '').trim(),
      estado: 'CDMX',
    });
  }
  return docs;
}

function leerDesdeJSON() {
  return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
}

async function cargarCatalogos() {
  const count = await CodigoPostal.countDocuments();
  if (count > 0) {
    console.log(`Limpiando catálogo existente (${count} registros)...`);
    await CodigoPostal.deleteMany({});
  }

  let docs;
  if (fs.existsSync(EXCEL_PATH)) {
    console.log('Leyendo datos desde Excel SEPOMEX...');
    docs = leerDesdeExcel();
  } else {
    console.log('Leyendo datos desde JSON local...');
    docs = leerDesdeJSON();
  }

  await CodigoPostal.insertMany(docs);
  console.log(`Catálogo CDMX cargado: ${docs.length} registros`);
}

module.exports = { cargarCatalogos };
