// CDMX = UTC-6 todo el año (México abolió el horario de verano en 2022).
const OFFSET_CDMX = '-06:00';

const tieneZonaHoraria = (str) => /(Z|[+-]\d{2}:?\d{2})$/i.test(str);

// Convierte fechas 'naive' (sin zona horaria), como las que manda la app móvil,
// a un instante correcto interpretándolas como hora de la Ciudad de México.
// Si la cadena ya trae 'Z' o un offset, se respeta tal cual.
function fechaMX(valor, defecto = null) {
  if (valor == null || valor === '') return defecto;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? defecto : valor;

  let s = String(valor).trim();
  if (!s) return defecto;

  if (tieneZonaHoraria(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? defecto : d;
  }

  s = s.replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    s += 'T00:00:00';
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
    s += ':00';
  }

  const d = new Date(`${s}${OFFSET_CDMX}`);
  return isNaN(d.getTime()) ? defecto : d;
}

module.exports = { fechaMX, OFFSET_CDMX };
