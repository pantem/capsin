const MascaraFolio = require('../models/MascaraFolio');

function resolveToken(token, data) {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const tokens = {
    prefijo: data.prefijo || '',
    aaaa: yyyy,
    yyyy: yyyy,
    mm: mm,
    MM: mm,
    dd: dd,
    DD: dd,
    alcaldia: data.alcaldia || '',
    seq: String(data.secuencia || 0),
    seq_padded: String(data.secuencia || 0).padStart(data.longitud_secuencia || 4, '0'),
  };

  return tokens[token] !== undefined ? tokens[token] : `{${token}}`;
}

function resolveFormat(formato, data) {
  return formato.replace(/\{(\w+)\}/g, (match, token) => resolveToken(token, data));
}

async function generarFolio(tipo) {
  const filtro = tipo === 'seguimiento'
    ? { aplica_a: { $in: ['seguimiento', 'ambos'] }, activo: true }
    : { aplica_a: { $in: ['siniestros', 'ambos'] }, activo: true };

  const mascara = await MascaraFolio.findOne(filtro).sort({ nombre: 1 });
  if (!mascara) return null;

  mascara.secuencia_actual += 1;
  await mascara.save();

  const folio = resolveFormat(mascara.formato, {
    prefijo: mascara.prefijo,
    secuencia: mascara.secuencia_actual,
    longitud_secuencia: mascara.longitud_secuencia,
    alcaldia: '',
  });

  return folio;
}

module.exports = { generarFolio, resolveFormat };
