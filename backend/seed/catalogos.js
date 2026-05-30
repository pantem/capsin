const XLSX = require('xlsx');
const path = require('path');
const CodigoPostal = require('../models/CodigoPostal');

const EXCEL_PATH = 'C:\\sepomex\\codigos.xls';
const SHEET_NAME = 'Distrito_Federal';

async function cargarCatalogos() {
  const count = await CodigoPostal.countDocuments();
  if (count > 0) {
    console.log(`Limpiando catálogo existente (${count} registros)...`);
    await CodigoPostal.deleteMany({});
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) {
    console.error(`Hoja "${SHEET_NAME}" no encontrada en ${EXCEL_PATH}`);
    return;
  }

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

  await CodigoPostal.insertMany(docs);
  console.log(`Catálogo CDMX cargado desde SEPOMEX: ${docs.length} registros`);
}

module.exports = { cargarCatalogos };
