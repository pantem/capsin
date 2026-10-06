const API = '/api';

let allSiniestros = [];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Mexico_City',
  });
}

function getBadgeClass(color) {
  if (color === 'red') return 'badge red';
  if (color === 'yellow') return 'badge yellow';
  if (color === 'black') return 'badge black';
  return 'badge green';
}

function getEstadoLabel(estado) {
  const map = {
    fallecido: 'Fallecido',
    lesionado_grave: 'Lesionado Grave',
    lesionado_leve: 'Lesionado Leve',
    ileso: 'Ileso',
  };
  return map[estado] || estado;
}

const ALCALDIAS_CDMX = [
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

let _dashboardStats = null;
let _alcCurrentPage = 1;
const _alcPerPage = 6;
let _alcFilter = 'all';

function renderDashboardChart(data) {
  const container = document.getElementById('chart-container');
  if (!container) return;

  const total = (data.sinDano || 0) + (data.moderado || 0) + (data.critico || 0) + (data.colapso || 0);

  const sinDanoVal = total > 0 ? data.sinDano : 724;
  const moderadoVal = total > 0 ? data.moderado : 329;
  const criticoVal = total > 0 ? data.critico : 197;
  const colapsoVal = total > 0 ? data.colapso : 0;
  const effectiveTotal = total > 0 ? total : 1250;

  const sinDanoPct = ((sinDanoVal / effectiveTotal) * 100).toFixed(1);
  const moderadoPct = ((moderadoVal / effectiveTotal) * 100).toFixed(1);
  const criticoPct = ((criticoVal / effectiveTotal) * 100).toFixed(1);
  const colapsoPct = ((colapsoVal / effectiveTotal) * 100).toFixed(1);

  const cx = 175;
  const cy = 150;
  const r = 90;

  const sinDanoAngle = (sinDanoVal / effectiveTotal) * 360;
  const moderadoAngle = (moderadoVal / effectiveTotal) * 360;
  const criticoAngle = (criticoVal / effectiveTotal) * 360;
  const colapsoAngle = (colapsoVal / effectiveTotal) * 360;

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', x, y,
      'L', end.x, end.y,
      'A', radius, radius, 0, largeArcFlag, 1, start.x, start.y,
      'Z',
    ].join(' ');
  }

  let currentAngle = 0;

  const a1_start = currentAngle;
  const a1_end = currentAngle + sinDanoAngle;
  currentAngle = a1_end;

  const a2_start = currentAngle;
  const a2_end = currentAngle + moderadoAngle;
  currentAngle = a2_end;

  const a3_start = currentAngle;
  const a3_end = currentAngle + criticoAngle;
  currentAngle = a3_end;

  const a4_start = currentAngle;
  const a4_end = 360;

  const d1 = describeArc(cx, cy, r, a1_start, a1_end);
  const d2 = describeArc(cx, cy, r, a2_start, a2_end);
  const d3 = describeArc(cx, cy, r, a3_start, a3_end);
  const d4 = describeArc(cx, cy, r, a4_start, a4_end);

  const mid1 = (a1_start + a1_end) / 2;
  const mid2 = (a2_start + a2_end) / 2;
  const mid3 = (a3_start + a3_end) / 2;
  const mid4 = (a4_start + a4_end) / 2;

  const edge1 = polarToCartesian(cx, cy, r + 4, mid1);
  const edge2 = polarToCartesian(cx, cy, r + 4, mid2);
  const edge3 = polarToCartesian(cx, cy, r + 4, mid3);
  const edge4 = polarToCartesian(cx, cy, r + 4, mid4);

  const txt1 = polarToCartesian(cx, cy, r + 45, mid1);
  const txt2 = polarToCartesian(cx, cy, r + 45, mid2);
  const txt3 = polarToCartesian(cx, cy, r + 45, mid3);
  const txt4 = polarToCartesian(cx, cy, r + 45, mid4);

  const anchor1 = mid1 > 180 ? 'end' : 'start';
  const anchor2 = mid2 > 180 ? 'end' : 'start';
  const anchor3 = mid3 > 180 ? 'end' : 'start';
  const anchor4 = mid4 > 180 ? 'end' : 'start';

  const off1 = anchor1 === 'end' ? -6 : 6;
  const off2 = anchor2 === 'end' ? -6 : 6;
  const off3 = anchor3 === 'end' ? -6 : 6;
  const off4 = anchor4 === 'end' ? -6 : 6;

  const svgHTML = `
    <svg viewBox="0 0 400 340" width="100%" height="100%" style="overflow:visible;max-height:340px;">
      <g>
        <path d="${d1}" fill="#55b74e" class="pie-slice">
          <title>Riesgo bajo: ${sinDanoPct}% (${sinDanoVal.toLocaleString()})</title>
        </path>
        <path d="${d2}" fill="#f7b731" class="pie-slice">
          <title>Riesgo medio: ${moderadoPct}% (${moderadoVal.toLocaleString()})</title>
        </path>
        <path d="${d3}" fill="#881337" class="pie-slice">
          <title>Riesgo alto: ${criticoPct}% (${criticoVal.toLocaleString()})</title>
        </path>
        <path d="${d4}" fill="#333333" class="pie-slice">
          <title>Colapso: ${colapsoPct}% (${colapsoVal.toLocaleString()})</title>
        </path>
      </g>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="22" font-weight="bold" fill="#FFF">${effectiveTotal.toLocaleString()}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="#FFF">Inmuebles</text>

      <g>
        <circle cx="${edge1.x}" cy="${edge1.y}" r="3" fill="#55b74e"/>
        <line x1="${edge1.x}" y1="${edge1.y}" x2="${txt1.x}" y2="${txt1.y}" stroke="#55b74e" stroke-width="1.5"/>
        <text x="${txt1.x + off1}" y="${txt1.y - 8}" text-anchor="${anchor1}" font-size="12" font-weight="600" fill="#333">Riesgo bajo</text>
        <text x="${txt1.x + off1}" y="${txt1.y + 8}" text-anchor="${anchor1}" font-size="11" fill="#555">${sinDanoVal.toLocaleString()} · ${sinDanoPct}%</text>
      </g>

      <g>
        <circle cx="${edge2.x}" cy="${edge2.y}" r="3" fill="#f7b731"/>
        <line x1="${edge2.x}" y1="${edge2.y}" x2="${txt2.x}" y2="${txt2.y}" stroke="#f7b731" stroke-width="1.5"/>
        <text x="${txt2.x + off2}" y="${txt2.y - 8}" text-anchor="${anchor2}" font-size="12" font-weight="600" fill="#333">Riesgo medio</text>
        <text x="${txt2.x + off2}" y="${txt2.y + 8}" text-anchor="${anchor2}" font-size="11" fill="#555">${moderadoVal.toLocaleString()} · ${moderadoPct}%</text>
      </g>

      <g>
        <circle cx="${edge3.x}" cy="${edge3.y}" r="3" fill="#881337"/>
        <line x1="${edge3.x}" y1="${edge3.y}" x2="${txt3.x}" y2="${txt3.y}" stroke="#881337" stroke-width="1.5"/>
        <text x="${txt3.x + off3}" y="${txt3.y - 8}" text-anchor="${anchor3}" font-size="12" font-weight="600" fill="#333">Riesgo alto</text>
        <text x="${txt3.x + off3}" y="${txt3.y + 8}" text-anchor="${anchor3}" font-size="11" fill="#555">${criticoVal.toLocaleString()} · ${criticoPct}%</text>
      </g>

      <g>
        <circle cx="${edge4.x}" cy="${edge4.y}" r="3" fill="#333333"/>
        <line x1="${edge4.x}" y1="${edge4.y}" x2="${txt4.x}" y2="${txt4.y}" stroke="#333333" stroke-width="1.5"/>
        <text x="${txt4.x + off4}" y="${txt4.y - 8}" text-anchor="${anchor4}" font-size="12" font-weight="600" fill="#333">Colapso</text>
        <text x="${txt4.x + off4}" y="${txt4.y + 8}" text-anchor="${anchor4}" font-size="11" fill="#555">${colapsoVal.toLocaleString()} · ${colapsoPct}%</text>
      </g>
    </svg>
  `;

  container.innerHTML = svgHTML;
}

function initAlcaldiaSelect() {
  const select = document.getElementById('select-alcaldia-filter');
  if (!select) return;

  select.innerHTML =
    '<option value="all">Todas las alcaldías</option>' +
    ALCALDIAS_CDMX.map((a) => `<option value="${a}">${a}</option>`).join('');

  select.addEventListener('change', (e) => {
    _alcFilter = e.target.value;
    _alcCurrentPage = 1;
    renderAlcaldiasGrid();
  });

  const prevBtn = document.getElementById('btn-alc-prev');
  const nextBtn = document.getElementById('btn-alc-next');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (_alcCurrentPage > 1) {
        _alcCurrentPage--;
        renderAlcaldiasGrid();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const items = getFilteredAlcaldias();
      const totalPages = Math.ceil(items.length / _alcPerPage);
      if (_alcCurrentPage < totalPages) {
        _alcCurrentPage++;
        renderAlcaldiasGrid();
      }
    });
  }
}

function getFilteredAlcaldias() {
  const data =
    (_dashboardStats && _dashboardStats.porAlcaldia && _dashboardStats.porAlcaldia.length > 0)
      ? _dashboardStats.porAlcaldia
      : ALCALDIAS_CDMX.map((a) => ({
        alcaldia: a,
        sinDano: 0,
        moderado: 0,
        critico: 0,
        colapso: 0,
        total: 0,
      }));

  if (_alcFilter === 'all') {
    return data;
  }
  return data.filter((d) => d.alcaldia === _alcFilter);
}

function renderAlcaldiasGrid() {
  const container = document.getElementById('alcaldias-cards-grid');
  const infoEl = document.getElementById('alcaldias-page-info');
  const prevBtn = document.getElementById('btn-alc-prev');
  const nextBtn = document.getElementById('btn-alc-next');
  if (!container) return;

  const items = getFilteredAlcaldias();
  const totalPages = Math.max(1, Math.ceil(items.length / _alcPerPage));
  if (_alcCurrentPage > totalPages) _alcCurrentPage = totalPages;

  const startIndex = (_alcCurrentPage - 1) * _alcPerPage;
  const pageItems = items.slice(startIndex, startIndex + _alcPerPage);

  container.innerHTML = pageItems
    .map(
      (item) => `
    <div class="alcaldia-card">
      <div class="alcaldia-name" title="${item.alcaldia}">${item.alcaldia}</div>
      <div class="damage-row row-sindano" onclick="abrirDetalleAlcaldia('${item.alcaldia.replace(/'/g, "\\'")}', 'sin_daños')">
        <div class="damage-row-label">
          <span class="legend-dot dot-green"></span>
          <span>Riesgo bajo</span>
        </div>
        <span class="damage-row-count">${item.sinDano || 0}</span>
      </div>
      <div class="damage-row row-moderado" onclick="abrirDetalleAlcaldia('${item.alcaldia.replace(/'/g, "\\'")}', 'moderado')">
        <div class="damage-row-label">
          <span class="legend-dot dot-amber"></span>
          <span>Riesgo medio</span>
        </div>
        <span class="damage-row-count">${item.moderado || 0}</span>
      </div>
      <div class="damage-row row-critico" onclick="abrirDetalleAlcaldia('${item.alcaldia.replace(/'/g, "\\'")}', 'critico')">
        <div class="damage-row-label">
          <span class="legend-dot dot-red"></span>
          <span>Riesgo alto</span>
        </div>
        <span class="damage-row-count">${item.critico || 0}</span>
      </div>
      <div class="damage-row row-colapso" onclick="abrirDetalleAlcaldia('${item.alcaldia.replace(/'/g, "\\'")}', 'colapso')" style="color:#000;">
        <div class="damage-row-label">
          <span class="legend-dot dot-black"></span>
          <span>Colapso</span>
        </div>
        <span class="damage-row-count">${item.colapso || 0}</span>
      </div>
    </div>
  `
    )
    .join('');

  if (infoEl) {
    infoEl.textContent = `${_alcCurrentPage}/${totalPages}`;
  }

  if (prevBtn) prevBtn.disabled = _alcCurrentPage <= 1;
  if (nextBtn) nextBtn.disabled = _alcCurrentPage >= totalPages;
}

async function loadDashboard() {
  try {
    const stats = await fetchJSON(`${API}/resumen`);
    _dashboardStats = stats;

    const hasData = stats.totalInmuebles != null && stats.totalInmuebles > 0;
    const totalInmuebles = hasData ? stats.totalInmuebles : 1250;
    const sinDano = hasData ? stats.inmueblesSinDanos || 0 : 724;
    const moderado = hasData ? stats.inmueblesModerados || 0 : 329;
    const critico = hasData ? stats.inmueblesCriticos || 0 : 197;
    const colapso = hasData ? stats.inmueblesColapso || 0 : 0;

    const sinDanoPct = totalInmuebles > 0 ? ((sinDano / totalInmuebles) * 100).toFixed(1) : '0.0';
    const moderadoPct =
      totalInmuebles > 0 ? ((moderado / totalInmuebles) * 100).toFixed(1) : '0.0';
    const criticoPct =
      totalInmuebles > 0 ? ((critico / totalInmuebles) * 100).toFixed(1) : '0.0';
    const colapsoPct =
      totalInmuebles > 0 ? ((colapso / totalInmuebles) * 100).toFixed(1) : '0.0';

    const kpiTotalEl = document.getElementById('kpi-total-inmuebles');
    const kpiSinDanoEl = document.getElementById('kpi-sin-dano');
    const kpiSinDanoPctEl = document.getElementById('kpi-sin-dano-pct');
    const kpiModeradoEl = document.getElementById('kpi-moderado');
    const kpiModeradoPctEl = document.getElementById('kpi-moderado-pct');
    const kpiCriticoEl = document.getElementById('kpi-critico');
    const kpiCriticoPctEl = document.getElementById('kpi-critico-pct');
    const kpiColapsoEl = document.getElementById('kpi-colapso');
    const kpiColapsoPctEl = document.getElementById('kpi-colapso-pct');

    if (kpiTotalEl) kpiTotalEl.textContent = totalInmuebles.toLocaleString();
    if (kpiSinDanoEl) kpiSinDanoEl.textContent = sinDano.toLocaleString();
    if (kpiSinDanoPctEl) kpiSinDanoPctEl.textContent = `${sinDanoPct}%`;
    if (kpiModeradoEl) kpiModeradoEl.textContent = moderado.toLocaleString();
    if (kpiModeradoPctEl) kpiModeradoPctEl.textContent = `${moderadoPct}%`;
    if (kpiCriticoEl) kpiCriticoEl.textContent = critico.toLocaleString();
    if (kpiCriticoPctEl) kpiCriticoPctEl.textContent = `${criticoPct}%`;
    if (kpiColapsoEl) kpiColapsoEl.textContent = colapso.toLocaleString();
    if (kpiColapsoPctEl) kpiColapsoPctEl.textContent = `${colapsoPct}%`;

    const tsEl = document.getElementById('dash-timestamp');
    if (tsEl) {
      if (stats.ultimaActualizacion) {
        const d = new Date(stats.ultimaActualizacion);
        tsEl.textContent = d.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Mexico_City',
        });
      } else {
        tsEl.textContent = '15 de septiembre de 2026, 17:24';
      }
    }

    renderDashboardChart({ sinDano, moderado, critico, colapso, total: totalInmuebles });
    renderAlcaldiasGrid();
  } catch (err) {
    console.error('Error cargando dashboard:', err);
    renderDashboardChart({ sinDano: 724, moderado: 329, critico: 197, colapso: 0, total: 1250 });
    renderAlcaldiasGrid();
  }
}

function dibujarPastelDashboard({ sinDano, moderado, critico, colapso, total }) {
  const W = 460;
  const H = 340;
  const S = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  const cx = 230;
  const cy = 170;
  const r = 105;
  const data = [
    { label: 'Riesgo bajo', v: sinDano, c: '#55b74e' },
    { label: 'Riesgo medio', v: moderado, c: '#f7b731' },
    { label: 'Riesgo alto', v: critico, c: '#881337' },
    { label: 'Colapso', v: colapso, c: '#333333' },
  ];
  const t = total > 0 ? total : 1;
  let start = -Math.PI / 2;

  data.forEach((d) => {
    const sweep = (d.v / t) * Math.PI * 2;
    if (sweep > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + sweep);
      ctx.closePath();
      ctx.fillStyle = d.c;
      ctx.fill();
    }

    const mid = start + sweep / 2;
    const ex = cx + Math.cos(mid) * (r + 5);
    const ey = cy + Math.sin(mid) * (r + 5);
    const lx = cx + Math.cos(mid) * (r + 38);
    const ly = cy + Math.sin(mid) * (r + 38);
    const der = Math.cos(mid) >= 0;

    ctx.strokeStyle = d.c;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = d.c;
    ctx.fill();

    ctx.textAlign = der ? 'left' : 'right';
    const tx = lx + (der ? 6 : -6);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(d.label, tx, ly - 4);
    ctx.fillStyle = '#555';
    ctx.font = '12px Arial';
    ctx.fillText(`${d.v} · ${((d.v / t) * 100).toFixed(1)}%`, tx, ly + 13);

    start += sweep;
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px Arial';
  ctx.fillText(String(total), cx, cy + 2);
  ctx.font = '13px Arial';
  ctx.fillText('Inmuebles', cx, cy + 22);

  return canvas.toDataURL('image/png');
}

async function exportarDashboardPDF() {
  const jspdfLib = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
  if (typeof html2canvas === 'undefined' || !jspdfLib) {
    alert('No se pudieron cargar las librerías para generar el PDF. Recarga la página y verifica tu conexión.');
    return;
  }

  const btn = document.getElementById('btn-export-dashboard');
  if (btn) btn.disabled = true;

  try {
    let stats = null;
    try {
      stats = await fetchJSON(`${API}/resumen`);
    } catch (fetchErr) {
      stats = _dashboardStats;
      if (!stats) throw fetchErr;
    }

    const total = stats.totalInmuebles || 0;
    const sinDano = stats.inmueblesSinDanos || 0;
    const moderado = stats.inmueblesModerados || 0;
    const critico = stats.inmueblesCriticos || 0;
    const colapso = stats.inmueblesColapso || 0;
    const pct = (n) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0.0%');

    const ahora = new Date();
    const fechaLarga = ahora.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City',
    });

    const kpis = [
      { titulo: 'Total de inmuebles', valor: total, sub: 'Inmuebles registrados', bg: '#fde8ef', color: '#7A0C38' },
      { titulo: 'Riesgo bajo', valor: sinDano, sub: `${pct(sinDano)} del total`, bg: '#e7f6e6', color: '#16a34a' },
      { titulo: 'Riesgo medio', valor: moderado, sub: `${pct(moderado)} del total`, bg: '#fdf1dd', color: '#f59e0b' },
      { titulo: 'Riesgo alto', valor: critico, sub: `${pct(critico)} del total`, bg: '#fde8e8', color: '#dc2626' },
      { titulo: 'Colapso', valor: colapso, sub: `${pct(colapso)} del total`, bg: '#eceff3', color: '#111827' },
    ];

    const iconoCasa =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

    const kpiHtml = kpis
      .map(
        (k) => `
      <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center;background:#fff;">
        <div style="width:38px;height:38px;border-radius:50%;background:${k.bg};color:${k.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconoCasa}</div>
        <div>
          <div style="font-size:11px;font-weight:bold;color:#334155;">${k.titulo}</div>
          <div style="font-size:26px;font-weight:bold;color:${k.color};line-height:1.15;">${k.valor.toLocaleString()}</div>
          <div style="font-size:10px;color:#64748b;">${k.sub}</div>
        </div>
      </div>`
      )
      .join('');

    const porAlc = Array.isArray(stats.porAlcaldia) ? stats.porAlcaldia : [];
    const totales = porAlc.reduce(
      (acc, a) => ({
        sinDano: acc.sinDano + (a.sinDano || 0),
        moderado: acc.moderado + (a.moderado || 0),
        critico: acc.critico + (a.critico || 0),
        colapso: acc.colapso + (a.colapso || 0),
        total: acc.total + (a.total || 0),
      }),
      { sinDano: 0, moderado: 0, critico: 0, colapso: 0, total: 0 }
    );

    const celda = (v, color) =>
      v > 0
        ? `<span style="color:${color};font-weight:600;">${v}</span>`
        : '<span style="color:#94a3b8;">—</span>';
    const td = 'padding:5px 8px;font-size:11px;text-align:center;';

    const filasAlc = porAlc
      .map(
        (a) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:5px 8px;font-size:11px;color:#334155;">${escHtml(a.alcaldia || '')}</td>
        <td style="${td}">${celda(a.sinDano || 0, '#16a34a')}</td>
        <td style="${td}">${celda(a.moderado || 0, '#f59e0b')}</td>
        <td style="${td}">${celda(a.critico || 0, '#dc2626')}</td>
        <td style="${td}">${celda(a.colapso || 0, '#111827')}</td>
        <td style="${td};font-weight:600;color:#334155;">${a.total || 0}</td>
      </tr>`
      )
      .join('');

    const html = `
      <div style="width:1000px;background:#fff;padding:26px 30px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:56px;height:56px;border-radius:50%;background:#7A0C38;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M4 20h3v-8H4v8zm6.5 0h3V4h-3v16zM17 20h3v-12h-3v12z"/></svg>
          </div>
          <div>
            <div style="font-size:12px;font-weight:bold;letter-spacing:3px;color:#7A0C38;">SAS</div>
            <div style="font-size:25px;font-weight:bold;color:#7A0C38;line-height:1.1;">REPORTE DE INMUEBLES DAÑADOS</div>
            <div style="font-size:12px;color:#64748b;">Resumen general del dashboard · Fecha de generación: ${fechaLarga}</div>
          </div>
        </div>

        <div style="border-top:2px solid #7A0C38;margin:14px 0 18px;"></div>

        <div style="display:flex;gap:12px;">${kpiHtml}</div>

        <div style="display:flex;gap:24px;margin-top:22px;align-items:flex-start;">
          <div style="width:40%;">
            <div style="font-size:15px;font-weight:bold;color:#7A0C38;">Distribución de inmuebles por nivel de daño</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Número de inmuebles registrados por nivel de riesgo</div>
            <img src="${dibujarPastelDashboard({ sinDano, moderado, critico, colapso, total })}" style="width:100%;display:block;" alt="Distribución">
          </div>
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:bold;color:#7A0C38;">Nivel de daño por alcaldía</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Información completa de las 16 alcaldías</div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#0f172a;color:#fff;">
                  <th style="padding:6px 8px;font-size:11px;text-align:left;">Alcaldía</th>
                  <th style="padding:6px 8px;font-size:11px;">Riesgo bajo</th>
                  <th style="padding:6px 8px;font-size:11px;">Riesgo medio</th>
                  <th style="padding:6px 8px;font-size:11px;">Riesgo alto</th>
                  <th style="padding:6px 8px;font-size:11px;">Colapso</th>
                  <th style="padding:6px 8px;font-size:11px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${filasAlc}
                <tr style="background:#f1f5f9;font-weight:bold;">
                  <td style="padding:6px 8px;font-size:11px;color:#334155;">TOTAL GENERAL</td>
                  <td style="${td};color:#16a34a;">${totales.sinDano}</td>
                  <td style="${td};color:#f59e0b;">${totales.moderado}</td>
                  <td style="${td};color:#dc2626;">${totales.critico}</td>
                  <td style="${td};color:#111827;">${totales.colapso}</td>
                  <td style="${td};color:#334155;">${totales.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;background:#fff;';
    container.innerHTML = html;
    document.body.appendChild(container);
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    document.body.removeChild(container);

    const pdf = new jspdfLib('l', 'mm', 'letter');
    const pageW = 279.4;
    const pageH = 215.9;
    const margin = 12;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    let w = contentW;
    let h = (canvas.height / canvas.width) * w;
    if (h > contentH) {
      h = contentH;
      w = (canvas.width / canvas.height) * h;
    }
    const x = (pageW - w) / 2;
    const y = margin + (contentH - h) / 2;

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', x, y, w, h);

    const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    pdf.save(`Dashboard_Inmuebles_Danados_${fecha}.pdf`);
  } catch (err) {
    alert(`Error al exportar el dashboard: ${err.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function abrirDetalleAlcaldia(alcaldia, dano) {
  const modal = document.getElementById('modal-alcaldia');
  const body = document.getElementById('modal-alcaldia-body');

  const danoLabels = {
    sin_daños: 'Riesgo bajo',
    moderado: 'Riesgo medio',
    critico: 'Riesgo alto',
    colapso: 'Colapso',
  };

  body.innerHTML = `<h2>${alcaldia} — ${danoLabels[dano] || dano}</h2><p style="color:#777;">Cargando...</p>`;
  modal.classList.remove('hidden');

  try {
    const data = await fetchJSON(`${API}/resumen/alcaldia-detalle?alcaldia=${encodeURIComponent(alcaldia)}&dano=${encodeURIComponent(dano)}`);

    if (data.length === 0) {
      body.innerHTML = `
        <h2>${alcaldia} — ${danoLabels[dano] || dano}</h2>
        <p style="color:#777;">No hay reportes con este nivel de daño en esta alcaldía.</p>
      `;
      return;
    }

    body.innerHTML = `
      <h2>${alcaldia} — ${danoLabels[dano] || dano}</h2>
      <p style="color:#666;margin-bottom:1rem;">${data.length} reporte(s) encontrado(s)</p>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
          <thead>
            <tr style="background:#f3f4f6;text-align:left;">
              <th style="padding:0.6rem;border-bottom:2px solid #e5e7eb;">Folio</th>
              <th style="padding:0.6rem;border-bottom:2px solid #e5e7eb;">Tipo de Inmueble</th>
              <th style="padding:0.6rem;border-bottom:2px solid #e5e7eb;">Nivel de Daño</th>
              <th style="padding:0.6rem;border-bottom:2px solid #e5e7eb;">Dirección</th>
              <th style="padding:0.6rem;border-bottom:2px solid #e5e7eb;text-align:center;">Acción</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr style="border-bottom:1px solid #e5e7eb;cursor:pointer;" onclick="cerrarModal('modal-alcaldia'); showDetail('${r.siniestroId}')" title="Ver detalle del reporte">
                <td style="padding:0.5rem;font-weight:600;">${r.folio || '—'}</td>
                <td style="padding:0.5rem;">${r.tipo || '—'}</td>
                <td style="padding:0.5rem;">
                  <span class="${getBadgeClass(r.estadoAfectacion === 'critico' ? 'red' : r.estadoAfectacion === 'moderado' ? 'yellow' : r.estadoAfectacion === 'colapso' ? 'black' : 'green')}">
                    ${r.estadoAfectacion === 'critico' ? 'Riesgo alto' : r.estadoAfectacion === 'moderado' ? 'Riesgo medio' : r.estadoAfectacion === 'colapso' ? 'Colapso' : 'Riesgo bajo'}
                  </span>
                </td>
                <td style="padding:0.5rem;color:#555;">${r.direccion || '—'}</td>
                <td style="padding:0.5rem;text-align:center;" onclick="event.stopPropagation();">
                  <button class="btn-download-report" onclick="descargarReporte('${r.siniestroId}')" title="Descargar Reporte (${r.folio || 'PDF'})" style="padding:0.3rem 0.6rem;font-size:0.75rem;">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Descargar</span>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `
      <h2>${alcaldia} — ${danoLabels[dano] || dano}</h2>
      <p style="color:#d32f2f;">Error al cargar: ${err.message}</p>
    `;
  }
}

function getAlcaldiaFromCP(cp) {
  if (!cp) return '';
  const cpStr = String(cp).trim();
  if (cpStr.startsWith('01')) return 'Álvaro Obregón';
  if (cpStr.startsWith('02')) return 'Azcapotzalco';
  if (cpStr.startsWith('03')) return 'Benito Juárez';
  if (cpStr.startsWith('04')) return 'Coyoacán';
  if (cpStr.startsWith('05')) return 'Cuajimalpa de Morelos';
  if (cpStr.startsWith('06')) return 'Cuauhtémoc';
  if (cpStr.startsWith('07')) return 'Gustavo A. Madero';
  if (cpStr.startsWith('08')) return 'Iztacalco';
  if (cpStr.startsWith('09')) return 'Iztapalapa';
  if (cpStr.startsWith('10')) return 'La Magdalena Contreras';
  if (cpStr.startsWith('11')) return 'Miguel Hidalgo';
  if (cpStr.startsWith('12')) return 'Milpa Alta';
  if (cpStr.startsWith('13')) return 'Tláhuac';
  if (cpStr.startsWith('14')) return 'Tlalpan';
  if (cpStr.startsWith('15')) return 'Venustiano Carranza';
  if (cpStr.startsWith('16')) return 'Xochimilco';
  return '';
}

function resolveAlcaldia(ubicacion) {
  if (!ubicacion) return 'Ciudad de México';
  if (ubicacion.municipio && ubicacion.municipio !== 'Ciudad de México' && ubicacion.municipio !== 'CDMX') {
    return ubicacion.municipio;
  }
  const fromCP = getAlcaldiaFromCP(ubicacion.codigo_postal);
  if (fromCP) return fromCP;

  const dir = (ubicacion.direccion || '').toLowerCase();
  const alcList = [
    'Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa de Morelos',
    'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'La Magdalena Contreras',
    'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'
  ];
  for (const a of alcList) {
    const cleanA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (dir.includes(cleanA)) return a;
  }
  return ubicacion.municipio || 'Ciudad de México';
}

let _reportesCurrentPage = 1;
let _reportesPerPage = 15;
let _reportesFilter = '';
let _reportesSearchDebounce = null;

function getPaginationButtons(current, total) {
  if (total <= 1) return '';
  let pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      pages = [1, 2, 3, 4, 5, '...', total];
    } else if (current >= total - 3) {
      pages = [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    } else {
      pages = [1, '...', current - 1, current, current + 1, '...', total];
    }
  }

  return pages.map(p => {
    if (p === '...') {
      return `<span class="pagination-dots">…</span>`;
    }
    const isActive = p === current;
    return `<button class="pagination-btn ${isActive ? 'active' : ''}" onclick="setReportesPage(${p})" type="button">${p}</button>`;
  }).join('');
}

function getPaginationButtonsUbicacion(current, total) {
  if (total <= 1) return '';
  let pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      pages = [1, 2, 3, 4, 5, '...', total];
    } else if (current >= total - 3) {
      pages = [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    } else {
      pages = [1, '...', current - 1, current, current + 1, '...', total];
    }
  }

  return pages.map(p => {
    if (p === '...') {
      return `<span class="pagination-dots">…</span>`;
    }
    const isActive = p === current;
    return `<button class="pagination-btn ${isActive ? 'active' : ''}" onclick="setUbicacionPage(${p})" type="button">${p}</button>`;
  }).join('');
}

function setReportesPage(page) {
  _reportesCurrentPage = page;
  renderReportesTable();
  const container = document.getElementById('view-lista');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function cambiarReportesPageSize(size) {
  _reportesPerPage = parseInt(size, 10) || 15;
  _reportesCurrentPage = 1;
  renderReportesTable();
}

function renderReportesTable() {
  const container = document.getElementById('reportes-lista');
  const countEl = document.getElementById('reportes-count');
  if (!container) return;

  const filter = _reportesFilter.trim().toLowerCase();
  const filtered = filter
    ? (allSiniestros || []).filter((s) =>
      (s.folio || '').toLowerCase().includes(filter) ||
      (s.ubicacion?.direccion || '').toLowerCase().includes(filter) ||
      (s.ubicacion?.municipio || '').toLowerCase().includes(filter) ||
      (s.ubicacion?.codigo_postal || '').toLowerCase().includes(filter)
    )
    : (allSiniestros || []);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / _reportesPerPage));
  if (_reportesCurrentPage > totalPages) _reportesCurrentPage = totalPages;
  if (_reportesCurrentPage < 1) _reportesCurrentPage = 1;

  const startIndex = totalItems === 0 ? 0 : (_reportesCurrentPage - 1) * _reportesPerPage;
  const endIndex = Math.min(startIndex + _reportesPerPage, totalItems);
  const pageItems = filtered.slice(startIndex, endIndex);

  if (countEl) {
    countEl.textContent = totalItems === 0 ? '0 reportes' : `${totalItems.toLocaleString()} reporte(s) en total`;
  }

  if (totalItems === 0) {
    container.innerHTML = '<p style="color:#777;padding:2.5rem;text-align:center;background:#fff;border-radius:12px;border:1px solid #eef0f3;">No se encontraron reportes con el criterio de búsqueda.</p>';
    return;
  }

  container.innerHTML = `
    <div class="reportes-table-container">
      <table class="reportes-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha de Registro</th>
            <th>Dirección / Ubicación</th>
            <th>Nivel de Riesgo</th>
            <th style="text-align:center;min-width:140px;">Descargar Reporte</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((s) => {
    const badgeClass = getBadgeClass(s.color);
    const labelRisk = s.color === 'red' ? 'Riesgo alto' : s.color === 'yellow' ? 'Riesgo medio' : s.color === 'black' ? 'Colapso' : 'Riesgo bajo';
    const alcaldia = resolveAlcaldia(s.ubicacion);
    return `
              <tr class="reporte-row" data-id="${s._id}">
                <td>
                  <div class="folio-cell">${s.folio || 'Sin folio'}</div>
                </td>
                <td>
                  <div class="fecha-cell">
                    <div>${formatDate(s.fecha)}</div>
                    ${s.fecha_sincronizacion ? `<div style="font-size:0.75rem;color:#888;">Sinc: ${formatDate(s.fecha_sincronizacion)}</div>` : ''}
                  </div>
                </td>
                <td>
                  <div class="ubicacion-cell">
                    <strong>${s.ubicacion?.direccion || 'Sin dirección'}</strong>
                    <div style="font-size:0.8rem;color:#666;">${alcaldia}${s.ubicacion?.codigo_postal ? ` • C.P. ${s.ubicacion.codigo_postal}` : ''}</div>
                  </div>
                </td>
                <td>
                  <span class="${badgeClass}">${labelRisk}</span>
                </td>
                <td style="text-align:center;" onclick="event.stopPropagation();">
                  <button class="btn-download-report" onclick="descargarReporte('${s._id}')" title="Descargar Reporte Oficial (${s.folio || 'PDF'})" type="button">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Descargar</span>
                  </button>
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>

      <!-- Pagination Footer -->
      <div class="pagination-footer">
        <div class="pagination-left">
          <span class="pagination-info">
            Mostrando <strong>${startIndex + 1}</strong> a <strong>${endIndex}</strong> de <strong>${totalItems.toLocaleString()}</strong> reportes
          </span>
          <div class="pagination-size-select">
            <span>Mostrar</span>
            <select onchange="cambiarReportesPageSize(this.value)">
              <option value="10" ${_reportesPerPage === 10 ? 'selected' : ''}>10</option>
              <option value="15" ${_reportesPerPage === 15 ? 'selected' : ''}>15</option>
              <option value="25" ${_reportesPerPage === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${_reportesPerPage === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${_reportesPerPage === 100 ? 'selected' : ''}>100</option>
            </select>
            <span>por página</span>
          </div>
        </div>

        <div class="pagination-right">
          <button class="pagination-btn" onclick="setReportesPage(1)" ${_reportesCurrentPage === 1 ? 'disabled' : ''} title="Primera página" type="button">«</button>
          <button class="pagination-btn" onclick="setReportesPage(${_reportesCurrentPage - 1})" ${_reportesCurrentPage === 1 ? 'disabled' : ''} title="Página anterior" type="button">‹</button>
          ${getPaginationButtons(_reportesCurrentPage, totalPages)}
          <button class="pagination-btn" onclick="setReportesPage(${_reportesCurrentPage + 1})" ${_reportesCurrentPage === totalPages ? 'disabled' : ''} title="Página siguiente" type="button">›</button>
          <button class="pagination-btn" onclick="setReportesPage(${totalPages})" ${_reportesCurrentPage === totalPages ? 'disabled' : ''} title="Última página" type="button">»</button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.reporte-row').forEach((el) => {
    el.addEventListener('click', () => showDetail(el.dataset.id));
  });
}

async function loadReportesList(filter = '') {
  const container = document.getElementById('reportes-lista');
  _reportesFilter = filter;
  try {
    if (!allSiniestros || allSiniestros.length === 0) {
      if (container) container.innerHTML = '<p style="color:#777;padding:2rem;text-align:center;">Cargando reportes...</p>';
      const mapaData = await fetchJSON(`${API}/mapa`);
      allSiniestros = mapaData;
    }
    renderReportesTable();
  } catch (err) {
    console.error('Error al cargar reportes:', err);
    if (container) container.innerHTML = `<p style="color:#d32f2f;padding:1.5rem;">Error al cargar reportes: ${err.message}</p>`;
  }
}

async function showDetail(siniestroId) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');

  try {
    const siniestro = await fetchJSON(`${API}/siniestros/${siniestroId}`);
    const inmuebles = await fetchJSON(`${API}/inmuebles?siniestro=${siniestroId}`);
    const inmueblesPadre = inmuebles.filter(inm => !inm.padre);

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:0.75rem;">
        <h2 style="margin:0;color:var(--primary-burgundy);">${siniestro.folio || 'Sin folio'}</h2>
        <button class="btn-download-report" onclick="descargarReporte('${siniestro._id}')" style="padding:0.5rem 1rem;font-size:0.85rem;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Descargar Reporte Oficial (PDF)</span>
        </button>
      </div>
      <p><strong>Fecha de creación:</strong> ${formatDate(siniestro.fecha)}</p>
      ${siniestro.capturista ? `<p><strong>Capturista:</strong> ${siniestro.capturista}</p>` : ''}
      ${siniestro.fecha_sincronizacion ? `<p><strong>Fecha de sincronización:</strong> ${formatDate(siniestro.fecha_sincronizacion)}</p>` : ''}
      <p><strong>Dirección:</strong> ${siniestro.ubicacion?.direccion || ''}, ${resolveAlcaldia(siniestro.ubicacion)}, ${siniestro.ubicacion?.estado || ''}</p>
      <p><strong>Coordenadas:</strong> ${siniestro.ubicacion?.lat}, ${siniestro.ubicacion?.lng}</p>
      <p><strong>Descripción:</strong> ${siniestro.descripcion || 'Sin descripción'}</p>
      ${siniestro.dispositivo_id ? `<p><strong>Dispositivo:</strong> ${siniestro.dispositivo_id}</p>` : ''}
      ${siniestro.fotos && siniestro.fotos.length > 0 ? `
        <div style="margin:1rem 0;">
          <p><strong>Fotos (${siniestro.fotos.length}):</strong></p>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
            ${siniestro.fotos.map(f => `
              <a href="${f.url}" target="_blank" rel="noopener">
                <img src="${f.url}" alt="${f.filename || 'Foto'}" style="width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #ddd;cursor:pointer;" onerror="this.style.display='none'">
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <h3>Inmuebles (${inmueblesPadre.length})</h3>
    `;

    if (inmueblesPadre.length === 0) {
      html += '<p>No hay inmuebles registrados.</p>';
    } else {
      for (const inm of inmueblesPadre) {
        const [damnificados, valores] = await Promise.all([
          fetchJSON(`${API}/damnificados?inmueble=${inm._id}`),
          fetchJSON(`${API}/valores-caracteristica?inmueble=${inm._id}`),
        ]);
        const hijos = inm.tipo === 'edificio' && inm.es_padre ? await fetchJSON(`${API}/inmuebles/${inm._id}/hijos`) : [];

        const nombreNorm = (v) =>
          (v.caracteristica?.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const numeroDe = (clave) => {
          for (const v of valores.filter((x) => nombreNorm(x).includes(clave))) {
            const crudo = v.valor_seleccion ?? v.valor_texto ?? v.valor_numero;
            const n = parseInt(crudo, 10);
            if (!Number.isNaN(n)) return n;
          }
          return null;
        };
        let nivelesSobre = numeroDe('numero de niveles sobre el terreno');
        let nivelesSotano = numeroDe('numero de sotanos');
        if (nivelesSobre === null && nivelesSotano === null) {
          nivelesSobre = inm.sobre_nivel_banqueta || 0;
          nivelesSotano = inm.bajo_nivel_banqueta || 0;
        }
        const nivelesTotales = (nivelesSobre || 0) + (nivelesSotano || 0);

        html += `
          <div style="background:#f8f9fa;padding:0.8rem;border-radius:8px;margin:0.5rem 0;">
            <p><strong>${inm.tipo === 'edificio' ? 'Edificio' : 'Casa'}</strong>
              ${inm.identificador ? `- ${inm.identificador}` : ''}
              <span class="${getBadgeClass(inm.estado_afectacion === 'critico' ? 'red' : inm.estado_afectacion === 'moderado' ? 'yellow' : inm.estado_afectacion === 'colapso' ? 'black' : 'green')}" style="margin-left:0.5rem;">
                ${inm.estado_afectacion === 'critico' ? 'Riesgo alto' : inm.estado_afectacion === 'moderado' ? 'Riesgo medio' : inm.estado_afectacion === 'colapso' ? 'Colapso' : 'Riesgo bajo'}
              </span>
            </p>
            <p style="font-size:0.9rem;color:#555;">Niveles sobre el terreno (2.10): ${nivelesSobre ?? 0} | Sótanos (2.11): ${nivelesSotano ?? 0} | Niveles totales: ${nivelesTotales}${inm.tipo_unidad ? ` | Tipo: ${inm.tipo_unidad}` : ''}</p>
            ${valores.length > 0 ? `
              <div style="margin-top:0.5rem;">
                <p style="font-weight:600;font-size:0.9rem;">Características capturadas:</p>
                <table style="font-size:0.85rem;">
                  <tr><th>Característica</th><th>Valor</th></tr>
                  ${valores.filter(v => v.caracteristica).map(v => {
          const nombre = v.caracteristica?.nombre || 'Sin nombre';
          let valor = '';
          if (v.valor_texto != null && v.valor_texto !== '') valor = v.valor_texto;
          else if (v.valor_numero != null) valor = v.valor_numero.toString();
          else if (v.valor_booleano != null) valor = v.valor_booleano ? 'Sí' : 'No';
          else if (v.valor_seleccion != null && v.valor_seleccion !== '') valor = v.valor_seleccion;
          else valor = '—';
          if (/alcald[ií]a/i.test(nombre)) valor = resolveAlcaldia(siniestro.ubicacion);
          if (v.valor_texto_condicional) {
            valor = valor && valor !== '—'
              ? `${valor} (${v.valor_texto_condicional})`
              : v.valor_texto_condicional;
          }
          return `<tr><td>${nombre}</td><td>${escHtml(valor)}</td></tr>`;
        }).join('')}
                </table>
              </div>
            ` : ''}
            ${damnificados.length > 0 ? `
              <!--p style="font-weight:600;margin-top:0.5rem;font-size:0.9rem;">Damnificados (${damnificados.length}):</p>
              <table>
                <tr><th>Nombre</th><th>Edad</th><th>Sexo</th><th>Estado</th><th>Traslado</th></tr>
                ${damnificados.map(d => `
                  <tr>
                    <td>${d.nombre || 'N/E'}</td>
                    <td>${d.edad || '-'}</td>
                    <td>${d.sexo || '-'}</td>
                    <td>${getEstadoLabel(d.estado)}</td>
                    <td>${d.requiere_traslado ? 'Sí' : 'No'}</td>
                  </tr>
                `).join('')}
              </table-->
            ` : '<!--p style="font-size:0.9rem;color:#999;">Sin damnificados registrados</p-->'}

            ${hijos.length > 0 ? `
              <p style="font-weight:600;margin-top:0.5rem;">Departamentos/Unidades (${hijos.length}):</p>
              ${hijos.map(h => `
                <div style="background:#fff;padding:0.5rem;border-radius:6px;margin:0.3rem 0;border-left:3px solid ${h.estado_afectacion === 'critico' ? '#d32f2f' : h.estado_afectacion === 'colapso' ? '#000000' : h.estado_afectacion === 'moderado' ? '#f57c00' : '#388e3c'};">
                  <p><strong>${h.identificador || 'Unidad'}</strong> - ${h.estado_afectacion === 'critico' ? 'Riesgo alto' : h.estado_afectacion === 'colapso' ? 'Colapso' : h.estado_afectacion === 'moderado' ? 'Riesgo medio' : 'Riesgo bajo'}</p>
                </div>
              `).join('')}
            ` : ''}
          </div>
        `;
      }
    }

    body.innerHTML = html;
    modal.classList.remove('hidden');
  } catch (err) {
    body.innerHTML = `<p style="color:#d32f2f;">Error al cargar detalle: ${err.message}</p>`;
    modal.classList.remove('hidden');
  }
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cargarImagenB64(url, { normalizarFoto = false } = {}) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (normalizarFoto) {
          const MAX = 1600;
          const scale = Math.min(1, MAX / img.width, MAX / img.height);
          const W = Math.max(1, Math.round(img.width * scale));
          const H = Math.max(1, Math.round(img.height * scale));
          canvas.width = W;
          canvas.height = H;
          ctx.drawImage(img, 0, 0, W, H);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const TITULOS_SECCIONES = {
  2: 'Inmueble (padrón)',
  3: 'Estado de la edificación',
  4: 'Clasificación global',
  5: 'Recomendaciones',
  6: 'Fotografías',
};

function extraerNumSeccion(nombre) {
  const m = String(nombre || '').match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : 0;
}

function extraerNumCaracteristica(nombre) {
  const m = String(nombre || '').match(/^(\d+(?:\.\d+)*)/);
  return m ? m[1] : '';
}

function extraerNombreLimpio(nombre) {
  return String(nombre || '').replace(/^\d+(?:\.\d+)*\s*/, '').trim();
}

function extraerValorDeValor(v) {
  if (!v) return null;
  if (v.valor_texto != null && v.valor_texto !== '') {
    return v.valor_texto_condicional ? `${v.valor_texto} (${v.valor_texto_condicional})` : v.valor_texto;
  }
  if (v.valor_numero != null) return String(v.valor_numero);
  if (v.valor_booleano != null) return v.valor_booleano ? 'Sí' : 'No';
  if (v.valor_seleccion != null && v.valor_seleccion !== '') {
    return v.valor_texto_condicional ? `${v.valor_seleccion} (${v.valor_texto_condicional})` : v.valor_seleccion;
  }
  return null;
}

function encabezadoReporteHTML(logoB64) {
  const MAROON = '#7A0C38';
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:6px;"><tr>
    <td style="width:30%;vertical-align:middle;">${logoB64 ? `<img src="${logoB64}" style="height:52px;" alt="Logo CDMX">` : ''}</td>
    <td style="width:60%;text-align:left;vertical-align:middle;padding-right:20px;">
      <div style="font-size:13px;font-weight:bold;color:#333;">SECRETARÍA DE VIVIENDA</div>
      <div style="font-size:8px;font-weight:bold;color:#555;">Dirección General de la</div>
      <div style="font-size:8px;font-weight:bold;color:#555;">Comisión para la Reconstrucción de la Ciudad de</div>
      <div style="font-size:8px;font-weight:bold;color:#555;">México.</div>
    </td>
    <td style="width:10%;vertical-align:middle;">
      <div>&nbsp;</div>
    </td>
  </tr></table>
  <div style="border-top:3px solid ${MAROON};">&nbsp;</div>
  <div style="height:10px;">&nbsp;</div>`;
}

async function renderizarEncabezadoReporte(logoB64) {
  const outer = document.createElement('div');
  outer.style.cssText =
    'position:fixed;left:-10000px;top:0;width:760px;background:#fff;font-family:Arial,Helvetica,sans-serif;';
  outer.innerHTML = `<div style="width:720px;margin:0 auto;padding:16px 20px 0 20px;background:#fff;">${encabezadoReporteHTML(logoB64)}</div>`;
  document.body.appendChild(outer);
  await new Promise((r) => setTimeout(r, 150));
  const canvas = await html2canvas(outer, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  document.body.removeChild(outer);
  return canvas;
}

function generarReporteHTML({ siniestro, inmueble, caracteristicas, valores, logoB64, fotosB64 }) {
  const folio = siniestro.folio || 'SAS-REPORTE';
  const fechaReporte = formatDate(siniestro.fecha || new Date());

  const dir = siniestro.ubicacion?.direccion || '—';
  const alcaldiaResolv = resolveAlcaldia(siniestro.ubicacion);
  const coords = (siniestro.ubicacion?.lat && siniestro.ubicacion?.lng)
    ? `${siniestro.ubicacion.lat}, ${siniestro.ubicacion.lng}`
    : 'No disponible';
  const descripcion = siniestro.descripcion || 'Sin observaciones adicionales registradas.';
  const dispositivo = siniestro.dispositivo_id || 'Dispositivo Móvil SAS';
  const capturista = siniestro.capturista || '—';

  const valoresMap = new Map();
  (valores || []).forEach(v => {
    if (v.caracteristica && v.caracteristica._id) {
      valoresMap.set(v.caracteristica._id, v);
    }
  });

  const secciones = new Map();
  (caracteristicas || []).forEach(c => {
    const secNum = extraerNumSeccion(c.nombre);
    if (!secNum) return;
    if (!secciones.has(secNum)) secciones.set(secNum, []);
    const valorObj = valoresMap.get(c._id);
    let valorTxt = extraerValorDeValor(valorObj);
    if (/alcald[ií]a/i.test(c.nombre)) valorTxt = alcaldiaResolv;
    secciones.get(secNum).push({
      num: extraerNumCaracteristica(c.nombre),
      nombre: extraerNombreLimpio(c.nombre),
      valor: valorTxt != null ? valorTxt : '—',
      esRiesgo: /riesgo|colapso/i.test(c.nombre),
    });
  });

  const MAROON = '#7A0C38';
  const th = `background:${MAROON};color:#fff;font-weight:bold;font-size:8px;padding:4px 6px;border:0.5px solid #cbd5e1;`;
  const td = 'font-size:8px;padding:3px 6px;border:0.5px solid #cbd5e1;vertical-align:top;';
  const tdNo = `font-size:8px;padding:3px 4px;border:0.5px solid #cbd5e1;text-align:center;font-weight:bold;color:${MAROON};vertical-align:top;`;

  const colorParaValor = (texto) => {
    const s = String(texto).toLowerCase();
    if (s.includes('colapso')) return '#111827';
    if (s.includes('alto') || s.includes('crítico') || s.includes('critico')) return '#991b1b';
    if (s.includes('medio') || s.includes('moderado') || s.includes('insegura')) return '#854d0e';
    if (s.includes('bajo') || s === 'no' || s === 'sí' || s === 'si') return '#166534';
    return null;
  };

  const makeSectionTable = (rows) => {
    let html = '<table style="width:100%;border-collapse:collapse;margin:4px 0 10px 0;">';
    html += `<tr><th style="${th}width:32px;">No.</th><th style="${th}">Características</th><th style="${th}width:40%;">Valor</th></tr>`;
    rows.forEach(r => {
      const valColor = colorParaValor(r.valor);
      const valStyle = (r.esRiesgo && valColor)
        ? `${td}font-weight:bold;color:${valColor};`
        : `${td}color:#475569;`;
      html += `<tr><td style="${tdNo}">${escHtml(r.num)}</td><td style="${td}">${escHtml(r.nombre)}</td><td style="${valStyle}">${escHtml(r.valor)}</td></tr>`;
    });
    html += '</table>';
    return html;
  };

  const sectionTitle = (num, text) => `
    <div class="corte-pdf">
      <div style="border-top:1.5px solid ${MAROON};margin-top:10px;"></div>
      <div style="font-size:11px;font-weight:bold;color:${MAROON};margin:8px 0 4px 0;">${num}. ${escHtml(text)}</div>
    </div>`;

  let html = '';
  html += `<div style="width:720px;margin:0 auto;padding:0 20px 16px 20px;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">`;

  html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <div>
      <img src="../images/logo_reporte.png" width="50" height="50" alt="SAS">
    </div>
    <div>
      <div style="font-size:14px;font-weight:bold;color:#1e293b;text-decoration:underline;">REPORTE DE INSPECCIÓN DE INMUEBLE</div>
      <div style="font-size:9px;color:#64748b;margin-top:2px;">SAS • Sistema de Afectaciones por Sismo</div>
    </div>
  </div>`;

  html += `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
    <tr>
      <td style="background:#fdf2f8;border:0.5px solid #f3d4e0;padding:4px 6px;font-size:7px;font-weight:bold;color:${MAROON};">Fecha</td>
      <td style="background:#fdf2f8;border:0.5px solid #f3d4e0;padding:4px 6px;font-size:7px;font-weight:bold;color:${MAROON};">Folio de inspección</td>
      <td style="background:#fdf2f8;border:0.5px solid #f3d4e0;padding:4px 6px;font-size:7px;font-weight:bold;color:${MAROON};">Coordenadas</td>
      <td style="background:#fdf2f8;border:0.5px solid #f3d4e0;padding:4px 6px;font-size:7px;font-weight:bold;color:${MAROON};">Dispositivo</td>
    </tr>
    <tr>
      <td style="border:0.5px solid #f3d4e0;padding:2px 6px;font-size:8px;font-weight:bold;">${escHtml(fechaReporte)}</td>
      <td style="border:0.5px solid #f3d4e0;padding:2px 6px;font-size:8px;font-weight:bold;">${escHtml(folio)}</td>
      <td style="border:0.5px solid #f3d4e0;padding:2px 6px;font-size:8px;font-weight:bold;">${escHtml(coords)}</td>
      <td style="border:0.5px solid #f3d4e0;padding:2px 6px;font-size:8px;font-weight:bold;">${escHtml(dispositivo)}</td>
    </tr>
    <tr><td colspan="4" style="background:#fdf2f8;border:0.5px solid #f3d4e0;padding:4px 6px;font-size:7px;font-weight:bold;color:${MAROON};">Dirección</td></tr>
    <tr><td colspan="4" style="border:0.5px solid #f3d4e0;padding:2px 6px;font-size:8px;font-weight:bold;">${escHtml(dir)}, ${escHtml(alcaldiaResolv)}, CDMX</td></tr>
    <tr><td colspan="4" style="background:#fdf2f8;border:0.5px solid #f3d4e0;padding:4px 6px;font-size:7px;font-weight:bold;color:${MAROON};">Descripción</td></tr>
    <tr><td colspan="4" style="border:0.5px solid #f3d4e0;padding:2px 6px;font-size:8px;">${escHtml(descripcion)}</td></tr>
  </table>`;

  const numsSeccion = [...secciones.keys()].sort((a, b) => a - b);

  const fotosGridHTML = (fotos) => {
    const POR_BLOQUE = 4;
    let out = '<div class="corte-foto"></div>';
    for (let i = 0; i < fotos.length; i += POR_BLOQUE) {
      if (i > 0) out += '<div class="corte-foto"></div>';
      out += '<div style="display:grid;grid-template-columns:repeat(2,1fr);column-gap:16px;row-gap:16px;width:calc(100% + 40px);margin-left:-20px;padding-top:6px;">';
      fotos.slice(i, i + POR_BLOQUE).forEach((b64, j) => {
        const n = i + j + 1;
        out += `<div style="text-align:center;">
          <img src="${b64}" style="display:block;width:100%;height:264px;object-fit:fill;border:1px solid #e2e8f0;border-radius:4px;background:#fff;" alt="Evidencia ${n}">
          <div style="font-size:8px;color:#475569;text-align:right;margin-top:3px;">Foto ${n}</div>
        </div>`;
      });
      out += '</div>';
    }
    return out;
  };

  numsSeccion.forEach(secNum => {
    const rows = secciones.get(secNum);
    const titulo = TITULOS_SECCIONES[secNum] || `Sección ${secNum}`;
    const fotosValidas = secNum === 6
      ? (fotosB64 || []).filter(b => b && b.indexOf('data:image') === 0)
      : [];
    if (fotosValidas.length > 0) html += '<div class="corte-foto"></div>';
    html += sectionTitle(String(secNum), titulo);
    html += makeSectionTable(rows);

    if (fotosValidas.length > 0) {
      html += fotosGridHTML(fotosValidas);
      html += `<div style="font-size:9px;font-weight:bold;color:#475569;text-align:center;margin:8px 0 10px 0;">Evidencia registrada durante la inspección</div>`;
    }
  });

  if (numsSeccion.length === 0) {
    html += `<div style="font-size:9px;color:#64748b;font-style:italic;text-align:center;margin:10px 0;">No hay características definidas para este tipo de inmueble.</div>`;
  }

  html += `</div>`;
  return html;
}

function dibujarFooterPDF(pdf, pageNum, totalPages, margaB64, mascotB64) {
  const pageW = 215.9;
  const pageH = 279.4;
  const marginL = 12;
  const footerTop = pageH - 26;

  pdf.setDrawColor(122, 12, 56);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, footerTop, pageW - marginL, footerTop);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(85, 85, 85);
  pdf.text('Edificio Juana de Arco Tlaxcoaque No. 8, piso 3, Col.', marginL, footerTop + 4);
  pdf.text('06080, Ciudad de México.', marginL, footerTop + 7.5);
  pdf.text('Alcaldía Cuauhtémoc', marginL, footerTop + 11);

  const imgY = footerTop + 3;
  const imgH = 14;
  if (margaB64 && margaB64.indexOf('data:image') === 0) {
    try { pdf.addImage(margaB64, 'PNG', pageW - marginL - 88, imgY, 28, imgH); } catch (e) { /* ignore */ }
  }
  if (mascotB64 && mascotB64.indexOf('data:image') === 0) {
    try { pdf.addImage(mascotB64, 'PNG', pageW - marginL - 55, imgY, 35, imgH); } catch (e) { /* ignore */ }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 51, 51);
  pdf.text(`Página | ${pageNum} de ${totalPages}`, pageW - marginL, footerTop + 4, { align: 'right' });
}

function obtenerCortesSeguros(container, escala) {
  const base = container.getBoundingClientRect().top;
  const suaves = new Set();
  const duros = new Set();
  const add = (set, v) => {
    const y = Math.round((v - base) * escala);
    if (y > 0) set.add(y);
  };
  container.querySelectorAll('tr, table, img, .corte-pdf').forEach((el) => {
    const r = el.getBoundingClientRect();
    add(suaves, r.top);
    add(suaves, r.bottom);
  });
  container.querySelectorAll('.corte-foto').forEach((el) => {
    const r = el.getBoundingClientRect();
    add(duros, r.top);
    add(duros, r.bottom);
  });
  return {
    suaves: Array.from(suaves).sort((a, b) => a - b),
    duros: Array.from(duros).sort((a, b) => a - b),
  };
}

async function descargarReporte(siniestroId) {
  const jspdfLib = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
  if (typeof html2canvas === 'undefined' || !jspdfLib) {
    alert('No se pudo cargar la librería PDF. Verifica tu conexión a internet e intenta de nuevo.');
    return;
  }

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Generando Reporte SAS...</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #7A0C38; }
          .loader { text-align: center; }
          .spinner { width: 44px; height: 44px; border: 4px solid #e2e8f0; border-top-color: #7A0C38; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h2 style="font-size:1.15rem;margin:0 0 6px;">Generando Reporte Oficial SAS...</h2>
          <p style="font-size:0.85rem;color:#64748b;margin:0;">Sistema de Afectaciones por Sismo • CDMX</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const siniestro = await fetchJSON(`${API}/siniestros/${siniestroId}`);
    const inmuebles = await fetchJSON(`${API}/inmuebles?siniestro=${siniestroId}`);
    const inmueblesPadre = inmuebles.filter(inm => !inm.padre);
    const inmueblePadre = inmueblesPadre[0] || inmuebles[0] || {};

    let tipoId = inmueblePadre.tipo_inmueble_ref;
    if (!tipoId) {
      const tipos = await fetchJSON(`${API}/tipos-inmueble?activos=true`);
      tipoId = tipos[0]?._id || null;
    }

    let caracteristicas = [];
    if (tipoId) {
      caracteristicas = await fetchJSON(`${API}/tipos-inmueble/${tipoId}/caracteristicas`);
    }

    let valores = [];
    if (inmueblePadre._id) {
      valores = await fetchJSON(`${API}/valores-caracteristica?inmueble=${inmueblePadre._id}`);
    }

    const folio = siniestro.folio || siniestroId;
    const origin = window.location.origin;

    const [logoB64, margaB64, mascotB64] = await Promise.all([
      cargarImagenB64(`${origin}/images/logo_cdmx_comision.webp`),
      cargarImagenB64(`${origin}/images/margarita_maza.png`),
      cargarImagenB64(`${origin}/images/mascota_mundial.png`),
    ]);

    const fotos = siniestro.fotos || [];
    const fotosB64 = await Promise.all(fotos.map(f => cargarImagenB64(f.url, { normalizarFoto: true })));

    const htmlContent = generarReporteHTML({ siniestro, inmueble: inmueblePadre, caracteristicas, valores, logoB64, fotosB64 });

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:760px;background:#fff;font-family:Arial,Helvetica,sans-serif;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const encabezadoCanvas = await renderizarEncabezadoReporte(logoB64);

    await new Promise(r => setTimeout(r, 300));

    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const cortesSeguros = obtenerCortesSeguros(container, canvas.width / container.offsetWidth);
    document.body.removeChild(container);

    const pdf = new jspdfLib('p', 'mm', 'letter');
    const pageW = 215.9;
    const pageH = 279.4;
    const marginL = 12;
    const marginR = 12;
    const marginT = 10;
    const footerH = 26;
    const contentW = pageW - marginL - marginR;
    const contentH = pageH - marginT - footerH;

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const pxPerMm = canvasW / contentW;
    const encHmm = (encabezadoCanvas.height * contentW) / encabezadoCanvas.width;
    const gapHmm = 1;
    const bodyTop = marginT + encHmm + gapHmm;
    const bodyHmmMax = Math.max(20, contentH - encHmm - gapHmm);
    const pageBodyPxH = Math.max(1, Math.floor(bodyHmmMax * pxPerMm));
    const encabezadoData = encabezadoCanvas.toDataURL('image/jpeg', 0.95);

    const minCuerpoPx = Math.floor(pageBodyPxH * 0.35);
    const hojas = [];
    let y = 0;
    while (y < canvasH) {
      let fin = y + pageBodyPxH;
      if (fin >= canvasH) {
        fin = canvasH;
      } else {
        const buscar = (puntos, desde) => {
          let mejor = -1;
          for (const p of puntos) {
            if (p < desde) continue;
            if (p > fin) break;
            mejor = p;
          }
          return mejor;
        };
        const corteDuro = buscar(cortesSeguros.duros, y + minCuerpoPx);
        if (corteDuro > 0) {
          fin = Math.max(y + minCuerpoPx, corteDuro);
        } else {
          const corteDuroCorto = buscar(cortesSeguros.duros, y + 1);
          if (corteDuroCorto > 0) {
            fin = corteDuroCorto;
          } else {
            const corteSuave = buscar(cortesSeguros.suaves, y + minCuerpoPx);
            if (corteSuave > 0) fin = Math.max(y + minCuerpoPx, corteSuave);
          }
        }
      }
      hojas.push([y, fin]);
      y = fin;
    }

    const totalPages = hojas.length;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      pdf.addImage(encabezadoData, 'JPEG', marginL, marginT, contentW, encHmm);

      const srcY = hojas[i][0];
      const srcH = Math.min(hojas[i][1], canvasH) - srcY;

      if (srcH > 0) {
        const slice = document.createElement('canvas');
        slice.width = canvasW;
        slice.height = srcH;
        const ctx = slice.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, srcY, canvasW, srcH, 0, 0, canvasW, srcH);

        const sliceData = slice.toDataURL('image/jpeg', 0.95);
        pdf.addImage(sliceData, 'JPEG', marginL, bodyTop, contentW, srcH / pxPerMm);
      }

      dibujarFooterPDF(pdf, i + 1, totalPages, margaB64, mascotB64);
    }

    pdf.save(`Reporte_SAS_${folio}.pdf`);

    if (win && !win.closed) {
      win.document.open();
      win.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><title>Reporte SAS</title>
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#7A0C38;}div{text-align:center;}</style>
        </head>
        <body><div>
          <h2>Reporte PDF generado</h2>
          <p style="color:#4b5563;">El archivo <strong>Reporte_SAS_${folio}.pdf</strong> se ha descargado.</p>
          <button onclick="window.close()" style="margin-top:1rem;padding:0.6rem 1.2rem;background:#7A0C38;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Cerrar</button>
        </div></body>
        </html>
      `);
      win.document.close();
    }
  } catch (err) {
    console.error('Error al generar reporte:', err);
    if (win && !win.closed) {
      win.document.body.innerHTML = `
        <div style="font-family:system-ui;padding:2.5rem;text-align:center;color:#dc2626;">
          <h3 style="margin-bottom:0.5rem;">Error al generar reporte</h3>
          <p style="color:#4b5563;">${err.message}</p>
          <button onclick="window.close()" style="margin-top:1.2rem;padding:0.6rem 1.2rem;background:#7A0C38;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Cerrar Ventana</button>
        </div>
      `;
    } else {
      alert(`Error al generar el reporte: ${err.message}`);
    }
  }
}

let _ubicData = [];
let _ubicFiltered = [];
let _ubicCurrentPage = 1;
let _ubicPerPage = 15;

function setUbicacionPage(page) {
  _ubicCurrentPage = page;
  renderUbicacion(_ubicFiltered, document.getElementById('ubic-count'), document.getElementById('ubic-resultados'));
  const container = document.getElementById('view-ubicacion');
  if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cambiarUbicacionPageSize(size) {
  _ubicPerPage = parseInt(size, 10) || 15;
  _ubicCurrentPage = 1;
  renderUbicacion(_ubicFiltered, document.getElementById('ubic-count'), document.getElementById('ubic-resultados'));
}

async function loadUbicacion() {
  const container = document.getElementById('ubic-resultados');
  const countEl = document.getElementById('ubic-count');
  container.innerHTML = '<p style="color:#777;">Cargando...</p>';

  try {
    const [data, filtros] = await Promise.all([
      fetchJSON(`${API}/ubicacion`),
      fetchJSON(`${API}/ubicacion/filtros`),
    ]);

    data.forEach((d) => {
      d.alcaldia = resolveAlcaldia({
        municipio: d.alcaldia,
        codigo_postal: d.codigoPostal,
        direccion: d.direccion,
        estado: d.estado,
      });
    });

    _ubicData = data;
    _ubicCurrentPage = 1;

    const alcaldiaSelect = document.getElementById('ubic-alcaldia');
    const coloniaSelect = document.getElementById('ubic-colonia');
    const currentAlcaldia = alcaldiaSelect.value;
    const currentColonia = coloniaSelect.value;

    const alcaldias = [...new Set(data.map((d) => d.alcaldia).filter(Boolean))].sort();
    alcaldiaSelect.innerHTML = '<option value="">Todas las alcaldías</option>' +
      alcaldias.map(a => `<option value="${escHtml(a)}" ${a === currentAlcaldia ? 'selected' : ''}>${escHtml(a)}</option>`).join('');
    coloniaSelect.innerHTML = '<option value="">Todas las colonias</option>' +
      filtros.colonias.map(c => `<option value="${c}" ${c === currentColonia ? 'selected' : ''}>${c}</option>`).join('');

    renderUbicacion(data, countEl, container);
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error al cargar: ${err.message}</p>`;
  }
}

function colorEstadoAfectacion(estado) {
  return estado === 'critico' ? '#d32f2f' : estado === 'colapso' ? '#000000' : estado === 'moderado' ? '#f57c00' : '#388e3c';
}

function etiquetaEstadoAfectacion(estado) {
  return estado === 'critico' ? 'Riesgo alto' : estado === 'colapso' ? 'Colapso' : estado === 'moderado' ? 'Riesgo medio' : 'Riesgo bajo';
}

function renderUbicacion(data, countEl, container) {
  _ubicFiltered = data;
  const totalItems = data.length;

  if (countEl) {
    countEl.textContent = totalItems === 0 ? '0 registro(s) encontrado(s)' : `${totalItems.toLocaleString()} registro(s) en total`;
  }

  if (totalItems === 0) {
    container.innerHTML = '<p style="color:#777;">No se encontraron inmuebles con los filtros seleccionados.</p>';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / _ubicPerPage));
  if (_ubicCurrentPage > totalPages) _ubicCurrentPage = totalPages;
  if (_ubicCurrentPage < 1) _ubicCurrentPage = 1;

  const startIndex = totalItems === 0 ? 0 : (_ubicCurrentPage - 1) * _ubicPerPage;
  const endIndex = Math.min(startIndex + _ubicPerPage, totalItems);
  const pageItems = data.slice(startIndex, endIndex);

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead>
          <tr style="background:#1a237e;color:#fff;text-align:left;">
            <th style="padding:0.6rem;">Folio</th>
            <th style="padding:0.6rem;">Fecha</th>
            <th style="padding:0.6rem;">Alcaldía</th>
            <th style="padding:0.6rem;">Dirección</th>
            <th style="padding:0.6rem;">CP</th>
            <th style="padding:0.6rem;">Uso</th>
            <th style="padding:0.6rem;">Niveles</th>
            <th style="padding:0.6rem;">Nivel de riesgo</th>
            <th style="padding:0.6rem;text-align:center;">Descargar</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(d => {
    const estadoColor = colorEstadoAfectacion(d.estadoAfectacion);
    const estadoLabel = etiquetaEstadoAfectacion(d.estadoAfectacion);
    return `
              <tr style="border-bottom:1px solid #e0e0e0;cursor:pointer;" onclick="showDetail('${d.siniestroId}')">
                <td style="padding:0.5rem;font-weight:600;">${d.folio || '—'}</td>
                <td style="padding:0.5rem;">${d.fecha ? formatDate(d.fecha) : '—'}</td>
                <td style="padding:0.5rem;">${d.alcaldia || '—'}</td>
                <td style="padding:0.5rem;">${d.direccion || '—'}</td>
                <td style="padding:0.5rem;">${d.codigoPostal || '—'}</td>
                <td style="padding:0.5rem;">${d.usoInmueble || '—'}</td>
                <td style="padding:0.5rem;text-align:center;">${d.totalNiveles}</td>
                <td style="padding:0.5rem;">
                  <span style="background:${estadoColor}22;color:${estadoColor};padding:2px 8px;border-radius:12px;font-weight:600;font-size:0.8rem;">
                    ${estadoLabel}
                  </span>
                </td>
                <td style="padding:0.5rem;text-align:center;" onclick="event.stopPropagation();">
                  <button class="btn-download-report" onclick="descargarReporte('${d.siniestroId}')" title="Descargar Reporte (${d.folio || 'PDF'})" style="padding:0.3rem 0.6rem;font-size:0.75rem;">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Descargar</span>
                  </button>
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>

      <div class="pagination-footer">
        <div class="pagination-left">
          <span class="pagination-info">
            Mostrando <strong>${startIndex + 1}</strong> a <strong>${endIndex}</strong> de <strong>${totalItems.toLocaleString()}</strong> registros
          </span>
          <div class="pagination-size-select">
            <span>Mostrar</span>
            <select onchange="cambiarUbicacionPageSize(this.value)">
              <option value="10" ${_ubicPerPage === 10 ? 'selected' : ''}>10</option>
              <option value="15" ${_ubicPerPage === 15 ? 'selected' : ''}>15</option>
              <option value="25" ${_ubicPerPage === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${_ubicPerPage === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${_ubicPerPage === 100 ? 'selected' : ''}>100</option>
            </select>
            <span>por página</span>
          </div>
        </div>
        <div class="pagination-right">
          <button class="pagination-btn" onclick="setUbicacionPage(1)" ${_ubicCurrentPage === 1 ? 'disabled' : ''} title="Primera página" type="button">«</button>
          <button class="pagination-btn" onclick="setUbicacionPage(${_ubicCurrentPage - 1})" ${_ubicCurrentPage === 1 ? 'disabled' : ''} title="Página anterior" type="button">‹</button>
          ${getPaginationButtonsUbicacion(_ubicCurrentPage, totalPages)}
          <button class="pagination-btn" onclick="setUbicacionPage(${_ubicCurrentPage + 1})" ${_ubicCurrentPage === totalPages ? 'disabled' : ''} title="Página siguiente" type="button">›</button>
          <button class="pagination-btn" onclick="setUbicacionPage(${totalPages})" ${_ubicCurrentPage === totalPages ? 'disabled' : ''} title="Última página" type="button">»</button>
        </div>
      </div>
    </div>
  `;
}

function filtrarUbicacion() {
  _ubicCurrentPage = 1;
  const alcaldia = document.getElementById('ubic-alcaldia').value;
  const colonia = document.getElementById('ubic-colonia').value;
  const cp = document.getElementById('ubic-cp').value.trim().toLowerCase();
  const dano = document.getElementById('ubic-dano').value;

  let filtered = _ubicData;
  if (alcaldia) filtered = filtered.filter(d => d.alcaldia === alcaldia);
  if (colonia) filtered = filtered.filter(d => d.direccion.toLowerCase().includes(colonia.toLowerCase()));
  if (cp) filtered = filtered.filter(d => d.codigoPostal === cp);
  if (dano) filtered = filtered.filter(d => d.estadoAfectacion === dano);

  const countEl = document.getElementById('ubic-count');
  const container = document.getElementById('ubic-resultados');
  renderUbicacion(filtered, countEl, container);
}

function exportarUbicacionXLSX() {
  const data = _ubicFiltered || [];
  if (data.length === 0) {
    alert('No hay registros para exportar.');
    return;
  }
  if (typeof XLSX === 'undefined') {
    alert('No se pudo cargar la librería de Excel (XLSX). Recarga la página y verifica tu conexión.');
    return;
  }

  const filas = data.map((d, i) => ({
    'No.': i + 1,
    'Folio': d.folio || '',
    'Fecha': d.fecha ? formatDate(d.fecha) : '',
    'Alcaldía': d.alcaldia || '',
    'Dirección': d.direccion || '',
    'CP': d.codigoPostal || '',
    'Uso': d.usoInmueble || '',
    'Niveles': d.totalNiveles,
    'Estado': etiquetaEstadoAfectacion(d.estadoAfectacion),
    'Tipo daño': d.tipoDanio || '',
  }));

  const ws = XLSX.utils.json_to_sheet(filas);
  ws['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 45 },
    { wch: 7 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ubicación');

  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(wb, `Ubicacion_Inmuebles_${fecha}.xlsx`);
}

document.querySelector('#modal .close').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.target.classList.add('hidden');
});

function switchView(viewName) {
  if (!viewName) return;
  document.querySelectorAll('nav button[data-view]').forEach((b) => {
    if (b.dataset.view === viewName) b.classList.add('active');
    else b.classList.remove('active');
  });
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.add('active');

  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'lista') loadReportesList();
  if (viewName === 'ubicacion') loadUbicacion();
  if (viewName === 'mapa') setTimeout(initMap, 100);
  if (viewName === 'tipos') setTimeout(loadTipos, 50);
  if (viewName === 'catalogo') setTimeout(loadCatalogo, 50);
  if (viewName === 'usuarios') setTimeout(loadUsuarios, 50);
  if (viewName === 'areas') setTimeout(loadAreas, 50);
  if (viewName === 'roles') setTimeout(loadRoles, 50);
  if (viewName === 'alta-inmuebles') setTimeout(loadInmueblesPadron, 50);
  if (viewName === 'mascaras') setTimeout(loadMascaras, 50);
}

document.querySelectorAll('nav button[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    switchView(btn.dataset.view);
  });
});

/* ---------- Dashboard Auth ---------- */

function actualizarHeaderAuth() {
  const userStr = sessionStorage.getItem('dashboard_user');
  const headerUser = document.getElementById('header-user');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');

  const navButtons = [
    { id: 'nav-usuarios', perm: 'ver_usuarios' },
    { id: 'nav-areas', perm: 'ver_areas' },
    { id: 'nav-roles', perm: 'ver_roles' },
    { id: 'nav-alta-inmuebles', perm: 'ver_alta_inmuebles' },
    { id: 'nav-mascaras', perm: 'ver_mascaras' },
  ];

  if (userStr) {
    const user = JSON.parse(userStr);
    const permisos = user.permisos || [];
    const rolNombre = user.rol && typeof user.rol === 'object' ? user.rol.nombre : (user.rol || '');
    headerUser.textContent = `${user.nombre} (${rolNombre})`;
    btnLogin.style.display = 'none';
    btnLogout.style.display = '';

    navButtons.forEach(nb => {
      const el = document.getElementById(nb.id);
      if (el) el.style.display = permisos.includes(nb.perm) ? '' : 'none';
    });
  } else {
    headerUser.textContent = '';
    btnLogin.style.display = '';
    btnLogout.style.display = 'none';
    navButtons.forEach(nb => {
      const el = document.getElementById(nb.id);
      if (el) el.style.display = 'none';
    });
  }
}

document.getElementById('btn-login').addEventListener('click', () => {
  const body = document.getElementById('modal-login-body');
  body.innerHTML = `
    <h2>Iniciar sesión</h2>
    <form id="form-login" onsubmit="event.preventDefault(); loginDashboard();">
      <div class="form-group">
        <label>Usuario</label>
        <input type="text" id="login-username" required>
      </div>
      <div class="form-group">
        <label>Contraseña</label>
        <input type="password" id="login-password" required>
      </div>
      <p id="login-error" style="color:#d32f2f;display:none;"></p>
      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button type="submit" class="btn-primary">Ingresar</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-login')">Cancelar</button>
      </div>
    </form>
  `;
  document.getElementById('modal-login').classList.remove('hidden');
  setTimeout(() => document.getElementById('login-username').focus(), 100);
});

async function loginDashboard() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!username || !password) { errorEl.textContent = 'Ingresa usuario y contraseña'; errorEl.style.display = ''; return; }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error || 'Error'; errorEl.style.display = ''; return; }

    sessionStorage.setItem('dashboard_user', JSON.stringify(data.usuario));
    cerrarModal('modal-login');
    actualizarHeaderAuth();
    switchView('dashboard');
  } catch (err) {
    errorEl.textContent = 'Error de conexión al servidor';
    errorEl.style.display = '';
  }
}

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('dashboard_user');
  actualizarHeaderAuth();
  switchView('dashboard');
});

document.getElementById('modal-login').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-login');
});

actualizarHeaderAuth();

document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(_reportesSearchDebounce);
  _reportesSearchDebounce = setTimeout(() => {
    _reportesFilter = e.target.value;
    _reportesCurrentPage = 1;
    renderReportesTable();
  }, 100);
});

initAlcaldiaSelect();
switchView('dashboard');
loadReportesList();

function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.getElementById('modal-tipo').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-tipo');
});
document.getElementById('modal-usuario').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-usuario');
});
document.getElementById('modal-area').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-area');
});
document.getElementById('modal-rol').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-rol');
});
document.getElementById('modal-mascara').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-mascara');
});
document.getElementById('modal-alcaldia').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-alcaldia');
});

let _cpSearchTimer = null;

document.getElementById('cp-search').addEventListener('input', () => {
  clearTimeout(_cpSearchTimer);
  _cpSearchTimer = setTimeout(buscarCP, 300);
});

document.getElementById('cp-municipio').addEventListener('change', buscarCP);

async function loadCatalogo() {
  try {
    const [municipios, data] = await Promise.all([
      fetchJSON(`${API}/codigos-postales/municipios`),
      fetchJSON(`${API}/codigos-postales?q=&limit=1000`),
    ]);
    const select = document.getElementById('cp-municipio');
    select.innerHTML = '<option value="">Todas las alcald&iacute;as</option>' +
      municipios.map(m => `<option value="${m}">${m}</option>`).join('');
    mostrarResultados(data);
  } catch (err) {
    document.getElementById('cp-resultados').innerHTML =
      `<p style="color:#d32f2f;">Error al cargar catálogo: ${err.message}</p>`;
  }
}

async function buscarCP() {
  const q = document.getElementById('cp-search').value.trim();
  const municipio = document.getElementById('cp-municipio').value;

  if (!q && !municipio) {
    try {
      const data = await fetchJSON(`${API}/codigos-postales?q=`);
      mostrarResultados(municipio ? data.filter(c => c.municipio === municipio) : data);
    } catch { }
    return;
  }

  try {
    const data = await fetchJSON(`${API}/codigos-postales?q=${encodeURIComponent(q)}&limit=200`);
    const filtered = municipio ? data.filter(c => c.municipio === municipio) : data;
    mostrarResultados(filtered);
  } catch (err) {
    document.getElementById('cp-resultados').innerHTML =
      `<p style="color:#d32f2f;">Error: ${err.message}</p>`;
  }
}

function mostrarResultados(data) {
  const container = document.getElementById('cp-resultados');
  const count = document.getElementById('cp-count');
  if (data.length === 0) {
    container.innerHTML = '<p style="color:#777;">Sin resultados.</p>';
    count.textContent = '';
    return;
  }
  count.textContent = `${data.length} registro(s) encontrado(s)`;
  container.innerHTML = data.map(c => `
    <div class="reporte-card" style="cursor:default;">
      <div>
        <div style="font-weight:700;color:#1a237e;">${c.codigo}</div>
        <div style="color:#555;font-size:0.9rem;">${c.colonia}</div>
        <div style="color:#777;font-size:0.85rem;">${c.tipo_asentamiento} · ${c.municipio}, ${c.estado}</div>
      </div>
    </div>
  `).join('');
}

async function loadTipos() {
  const container = document.getElementById('tipos-lista');
  try {
    const tipos = await fetchJSON(`${API}/tipos-inmueble`);
    if (tipos.length === 0) {
      container.innerHTML = '<p style="color:#777;">No hay tipos de inmueble registrados.</p>';
      return;
    }
    container.innerHTML = tipos.map(t => `
        <div class="tipo-card ${t.activo ? '' : 'inactivo'}">
          <div>
            <div class="tipo-nombre">${t.nombre}</div>
            <div class="tipo-desc">${t.descripcion || 'Sin descripción'}</div>
            <div class="tipo-meta">${t.activo ? 'Activo' : 'Inactivo'}</div>
          </div>
          <div class="acciones">
            <label class="switch">
              <input type="checkbox" ${t.activo ? 'checked' : ''} onchange="toggleActivo('${t._id}', this.checked)">
              <span class="slider"></span>
            </label>
            <button class="btn-sm" onclick="abrirFormTipo('${t._id}')">✏️</button>
            <button class="btn-danger" onclick="eliminarTipo('${t._id}')">🗑</button>
          </div>
        </div>`
    ).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error: ${err.message}</p>`;
  }
}

async function toggleActivo(id, activo) {
  try {
    await fetch(`${API}/tipos-inmueble/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    });
    loadTipos();
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

async function eliminarTipo(id) {
  if (!confirm('¿Eliminar este tipo de inmueble y sus características?')) return;
  try {
    await fetch(`${API}/tipos-inmueble/${id}`, { method: 'DELETE' });
    loadTipos();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

let _caractsTemp = [];
let _editandoTipoId = null;

async function abrirFormTipo(id) {
  _caractsTemp = [];
  _editandoTipoId = id || null;
  const body = document.getElementById('modal-tipo-body');

  let nombre = '', descripcion = '';

  if (id) {
    const tipo = await fetchJSON(`${API}/tipos-inmueble/${id}`);
    nombre = tipo.nombre || '';
    descripcion = tipo.descripcion || '';
    const raw = await fetchJSON(`${API}/tipos-inmueble/${id}/caracteristicas`);
    _caractsTemp = raw.map(c => ({
      nombre: c.nombre,
      tipoDato: c.tipo_dato,
      opciones: c.opciones || [],
      requerido: c.requerido || false,
      renderType: c.render_type || 'auto',
      condicionalTexto: c.condicional_texto || 'no',
      minimo: c.minimo ?? null,
      maximo: c.maximo ?? null,
      orden: c.orden ?? 0,
    }));
  }

  body.innerHTML = `
    <h2>${id ? 'Editar Tipo' : 'Nuevo Tipo'}</h2>
    <form id="form-tipo" onsubmit="event.preventDefault(); guardarTipo();">
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="tipo-nombre" value="${nombre}" required>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="tipo-desc">${descripcion}</textarea>
      </div>

      <h3>Características (${_caractsTemp.length})</h3>
      <div id="caracts-lista">
        ${_caractsTemp.length === 0 ? '<p style="color:#999;font-size:0.9rem;">Sin características</p>' : ''}
      </div>
      <button type="button" class="btn-sm" onclick="abrirFormCaract()" style="margin-bottom:1rem;">+ Agregar Característica</button>

      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Tipo'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-tipo')">Cancelar</button>
      </div>
    </form>
  `;

  renderCaractsLista();
  document.getElementById('modal-tipo').classList.remove('hidden');
}

function renderCaractsLista() {
  const container = document.getElementById('caracts-lista');
  if (!container) return;
  if (_caractsTemp.length === 0) {
    container.innerHTML = '<p style="color:#999;font-size:0.9rem;">Sin características</p>';
    return;
  }
  _caractsTemp.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  container.innerHTML = _caractsTemp.map((c, i) => {
    const tipoLabel = { texto: 'Texto', textarea: 'Texto largo', numero: 'Número', booleano: 'Sí/No', seleccion: 'Selección', multiseleccion: 'Multiselección' };
    const td = c.tipoDato || c.tipo_dato || '';
    return `
      <div class="caract-item">
        <div class="caract-info">
          <div class="caract-nombre">${c.nombre}</div>
          <div class="caract-detalle">${tipoLabel[td] || td} · #${c.orden ?? i} ${c.requerido ? '· Requerido' : ''}              ${(td === 'seleccion' || td === 'multiseleccion') && c.opciones?.length ? ' · Opciones: ' + c.opciones.join(', ') : ''}              ${td === 'numero' && (c.minimo != null || c.maximo != null) ? ` · Rango: ${c.minimo ?? '?'} - ${c.maximo ?? '?'}` : ''}</div>
        </div>
        <div class="caract-acciones">
          <button type="button" class="btn-sm" onclick="abrirFormCaract(${i})">✏️</button>
          <button type="button" class="btn-danger" onclick="eliminarCaract(${i})">🗑</button>
        </div>
      </div>`;
  }).join('');
}

function abrirFormCaract(idx) {
  const c = idx !== undefined ? _caractsTemp[idx] : { nombre: '', tipoDato: 'texto', opciones: [], requerido: false, renderType: 'auto', condicionalTexto: 'no', minimo: null, maximo: null };
  const isNew = idx === undefined;

  const modalBody = document.getElementById('modal-tipo-body');
  const form = document.getElementById('form-tipo');

  const opcionesStr = (c.tipoDato === 'seleccion' || c.tipoDato === 'multiseleccion') ? (c.opciones || []).join('\n') : '';

  const section = document.createElement('div');
  section.id = 'caract-form-section';
  section.style.cssText = 'background:#f0f2f5;padding:1rem;border-radius:8px;margin-bottom:1rem;';
  section.innerHTML = `
    <h4 style="margin-bottom:0.5rem;">${isNew ? 'Nueva Característica' : 'Editar Característica'}</h4>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" id="caract-nombre" value="${c.nombre}" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo de dato</label>
        <select id="caract-tipo" onchange="onCaractTipoChange()">
          <option value="texto" ${c.tipoDato === 'texto' ? 'selected' : ''}>Texto</option>
          <option value="textarea" ${c.tipoDato === 'textarea' ? 'selected' : ''}>Texto largo</option>
          <option value="numero" ${c.tipoDato === 'numero' ? 'selected' : ''}>Número</option>
          <option value="booleano" ${c.tipoDato === 'booleano' ? 'selected' : ''}>Sí/No</option>
            <option value="seleccion" ${c.tipoDato === 'seleccion' ? 'selected' : ''}>Selección</option>
            <option value="multiseleccion" ${c.tipoDato === 'multiseleccion' ? 'selected' : ''}>Multiselección</option>
        </select>
      </div>
      <div class="form-group">
        <label>Orden</label>
        <input type="number" id="caract-orden" value="${c.orden ?? (idx >= 0 ? idx : 0)}" min="0">
      </div>
      <div class="form-group checkbox" style="align-self:flex-end;">
        <input type="checkbox" id="caract-req" ${c.requerido ? 'checked' : ''}>
        <label for="caract-req">Requerido</label>
      </div>
      <div class="form-group" id="caract-render-group" style="${c.tipoDato === 'seleccion' || c.tipoDato === 'multiseleccion' ? '' : 'display:none;'}">
        <label>Visualización</label>
        <select id="caract-render-type">
          <option value="auto" ${(c.renderType || 'auto') === 'auto' ? 'selected' : ''}>Automático</option>
          <option value="dropdown" ${c.renderType === 'dropdown' ? 'selected' : ''}>Desplegable</option>
          <option value="radio" ${c.renderType === 'radio' ? 'selected' : ''}>Radio</option>
        </select>
      </div>
      <div class="form-group">
        <label>Condicional texto</label>
        <select id="caract-cond-texto">
          <option value="no" ${(c.condicionalTexto || 'no') === 'no' ? 'selected' : ''}>No</option>
          <option value="si" ${c.condicionalTexto === 'si' ? 'selected' : ''}>Sí</option>
        </select>
      </div>
    </div>
    <div class="form-row" id="caract-rango-group" style="${c.tipoDato === 'numero' ? '' : 'display:none;'}">
      <div class="form-group">
        <label>Mínimo</label>
        <input type="number" id="caract-minimo" value="${c.minimo ?? ''}">
      </div>
      <div class="form-group">
        <label>Máximo</label>
        <input type="number" id="caract-maximo" value="${c.maximo ?? ''}">
      </div>
    </div>
    <div class="form-group" id="caract-opciones-group" style="${c.tipoDato === 'seleccion' || c.tipoDato === 'multiseleccion' ? '' : 'display:none;'}">
      <label>Opciones (una por línea)</label>
      <textarea id="caract-opciones" rows="3">${opcionesStr}</textarea>
    </div>
    <div style="display:flex;gap:0.5rem;">
      <button type="button" class="btn-primary" onclick="guardarCaract(${idx})">${isNew ? 'Agregar' : 'Guardar'}</button>
      <button type="button" class="btn-sm" onclick="cancelarCaractForm()">Cancelar</button>
    </div>
    <input type="hidden" id="caract-edit-idx" value="${idx}">
  `;

  const existente = document.getElementById('caract-form-section');
  if (existente) existente.remove();
  form.insertBefore(section, form.lastElementChild);
}

function onCaractTipoChange() {
  const tipo = document.getElementById('caract-tipo').value;
  const group = document.getElementById('caract-opciones-group');
  const rango = document.getElementById('caract-rango-group');
  const renderGroup = document.getElementById('caract-render-group');
  group.style.display = tipo === 'seleccion' || tipo === 'multiseleccion' ? '' : 'none';
  rango.style.display = tipo === 'numero' ? '' : 'none';
  renderGroup.style.display = tipo === 'seleccion' || tipo === 'multiseleccion' ? '' : 'none';
}

function cancelarCaractForm() {
  const section = document.getElementById('caract-form-section');
  if (section) section.remove();
}

function guardarCaract(idx) {
  const nombre = document.getElementById('caract-nombre').value.trim();
  if (!nombre) { alert('El nombre es requerido'); return; }
  const tipoDato = document.getElementById('caract-tipo').value;
  const requerido = document.getElementById('caract-req').checked;
  const orden = parseInt(document.getElementById('caract-orden').value) || 0;
  const opciones = tipoDato === 'seleccion' || tipoDato === 'multiseleccion'
    ? document.getElementById('caract-opciones').value.split('\n').map(s => s.trim()).filter(s => s)
    : [];
  const minimoRaw = document.getElementById('caract-minimo').value;
  const maximoRaw = document.getElementById('caract-maximo').value;
  const minimo = tipoDato === 'numero' && minimoRaw !== '' ? Number(minimoRaw) : null;
  const maximo = tipoDato === 'numero' && maximoRaw !== '' ? Number(maximoRaw) : null;
  const renderType = (tipoDato === 'seleccion' || tipoDato === 'multiseleccion')
    ? document.getElementById('caract-render-type').value
    : 'auto';
  const condicionalTexto = document.getElementById('caract-cond-texto').value;

  const caract = { nombre, tipoDato, requerido, opciones, minimo, maximo, orden, renderType, condicionalTexto };

  if (idx === undefined || idx === -1) {
    _caractsTemp.push(caract);
  } else {
    _caractsTemp[idx] = caract;
  }

  cancelarCaractForm();
  renderCaractsLista();
}

function eliminarCaract(idx) {
  _caractsTemp.splice(idx, 1);
  renderCaractsLista();
}

async function guardarTipo() {
  const nombre = document.getElementById('tipo-nombre').value.trim();
  if (!nombre) { alert('El nombre es requerido'); return; }
  const descripcion = document.getElementById('tipo-desc').value.trim();

  try {
    let tipoId = _editandoTipoId;

    if (tipoId) {
      await fetch(`${API}/tipos-inmueble/${tipoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
    } else {
      const res = await fetch(`${API}/tipos-inmueble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
      const created = await res.json();
      tipoId = created._id;
    }

    if (_caractsTemp.length > 0) {
      const resCaracts = await fetch(`${API}/tipos-inmueble/${tipoId}/caracteristicas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caracteristicas: _caractsTemp.map((c) => ({
            nombre: c.nombre,
            tipo_dato: c.tipoDato,
            opciones: c.opciones,
            requerido: c.requerido,
            orden: c.orden ?? 0,
            render_type: c.renderType || 'auto',
            condicional_texto: c.condicionalTexto || 'no',
            minimo: c.minimo,
            maximo: c.maximo,
          })),
        }),
      });
      if (!resCaracts.ok) {
        const err = await resCaracts.json().catch(() => ({ error: 'Error desconocido' }));
        alert('Error al guardar características: ' + (err.error || resCaracts.statusText));
        return;
      }
    }

    cerrarModal('modal-tipo');
    loadTipos();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

/* ---------- Usuarios CRUD ---------- */

let _editandoUsuarioId = null;

async function loadUsuarios() {
  const container = document.getElementById('usuarios-lista');
  try {
    const usuarios = await fetchJSON(`${API}/usuarios`);
    if (usuarios.length === 0) {
      container.innerHTML = '<p style="color:#777;">No hay usuarios registrados.</p>';
      return;
    }
    container.innerHTML = usuarios.map(u => {
      const areaNombre = u.area && typeof u.area === 'object' ? u.area.nombre : (u.area || '');
      const rolNombre = u.rol && typeof u.rol === 'object' ? u.rol.nombre : (u.rol || '');
      return `
      <div class="tipo-card ${u.activo ? '' : 'inactivo'}">
        <div>
          <div class="tipo-nombre">${u.nombre}</div>
          <div class="tipo-desc">@${u.username} · ${rolNombre}</div>
          <div class="tipo-meta">${areaNombre} · ${u.activo ? 'Activo' : 'Inactivo'}</div>
        </div>
        <div class="acciones">
          <button class="btn-sm" onclick="abrirFormUsuario('${u._id}')">✏️</button>
          <button class="btn-danger" onclick="eliminarUsuario('${u._id}')">🗑</button>
        </div>
      </div>
    `}).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error: ${err.message}</p>`;
  }
}

async function abrirFormUsuario(id) {
  _editandoUsuarioId = id || null;
  const body = document.getElementById('modal-usuario-body');

  let nombre = '', username = '', password = '', areaId = '', rolId = '';
  let areas = [], roles = [];

  try {
    areas = await fetchJSON(`${API}/areas`);
    roles = await fetchJSON(`${API}/roles`);
  } catch { }

  if (id) {
    const u = await fetchJSON(`${API}/usuarios/${id}`);
    nombre = u.nombre || '';
    username = u.username || '';
    areaId = u.area && typeof u.area === 'object' ? u.area._id : (u.area || '');
    rolId = u.rol && typeof u.rol === 'object' ? u.rol._id : (u.rol || '');
  }

  body.innerHTML = `
    <h2>${id ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
    <form id="form-usuario" onsubmit="event.preventDefault(); guardarUsuario();">
      <div class="form-group">
        <label>Nombre completo</label>
        <input type="text" id="usuario-nombre" value="${nombre}" required>
      </div>
      <div class="form-group">
        <label>Nombre de usuario</label>
        <input type="text" id="usuario-username" value="${username}" required>
      </div>
      <div class="form-group">
        <label>Contraseña ${id ? '(dejar vacío para mantener actual)' : ''}</label>
        <input type="password" id="usuario-password" ${id ? '' : 'required'}>
      </div>
      <div class="form-group">
        <label>Área</label>
        <select id="usuario-area">
          <option value="">Seleccionar área...</option>
          ${areas.map(a => `<option value="${a._id}" ${areaId === a._id ? 'selected' : ''}>${a.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Rol</label>
        <select id="usuario-rol">
          ${roles.map(r => `<option value="${r._id}" ${rolId === r._id ? 'selected' : ''}>${r.nombre}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Usuario'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-usuario')">Cancelar</button>
      </div>
    </form>
  `;

  document.getElementById('modal-usuario').classList.remove('hidden');
}

async function guardarUsuario() {
  const nombre = document.getElementById('usuario-nombre').value.trim();
  const username = document.getElementById('usuario-username').value.trim();
  const password = document.getElementById('usuario-password').value;
  const area = document.getElementById('usuario-area').value;
  const rol = document.getElementById('usuario-rol').value;

  if (!nombre || !username) { alert('Nombre y usuario son requeridos'); return; }
  if (!_editandoUsuarioId && !password) { alert('La contraseña es requerida'); return; }

  try {
    if (_editandoUsuarioId) {
      await fetch(`${API}/usuarios/${_editandoUsuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, username, password: password || undefined, area, rol }),
      });
    } else {
      await fetch(`${API}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, username, password, area, rol }),
      });
    }

    cerrarModal('modal-usuario');
    loadUsuarios();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  try {
    await fetch(`${API}/usuarios/${id}`, { method: 'DELETE' });
    loadUsuarios();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

/* ---------- Áreas CRUD ---------- */

let _editandoAreaId = null;

async function loadAreas() {
  const container = document.getElementById('areas-lista');
  try {
    const areas = await fetchJSON(`${API}/areas`);
    if (areas.length === 0) {
      container.innerHTML = '<p style="color:#777;">No hay áreas registradas.</p>';
      return;
    }
    container.innerHTML = areas.map(a => `
      <div class="tipo-card ${a.activo ? '' : 'inactivo'}">
        <div>
          <div class="tipo-nombre">${a.nombre}</div>
          <div class="tipo-desc">${a.descripcion || 'Sin descripción'}</div>
          <div class="tipo-meta">${a.activo ? 'Activo' : 'Inactivo'}</div>
        </div>
        <div class="acciones">
          <label class="switch">
            <input type="checkbox" ${a.activo ? 'checked' : ''} onchange="toggleActivoArea('${a._id}', this.checked)">
            <span class="slider"></span>
          </label>
          <button class="btn-sm" onclick="abrirFormArea('${a._id}')">✏️</button>
          <button class="btn-danger" onclick="eliminarArea('${a._id}')">🗑</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error: ${err.message}</p>`;
  }
}

async function toggleActivoArea(id, activo) {
  try {
    await fetch(`${API}/areas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    });
    loadAreas();
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

async function eliminarArea(id) {
  if (!confirm('¿Eliminar esta área?')) return;
  try {
    const res = await fetch(`${API}/areas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    loadAreas();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

async function abrirFormArea(id) {
  _editandoAreaId = id || null;
  const body = document.getElementById('modal-area-body');

  let nombre = '', descripcion = '';

  if (id) {
    const a = await fetchJSON(`${API}/areas/${id}`);
    nombre = a.nombre || '';
    descripcion = a.descripcion || '';
  }

  body.innerHTML = `
    <h2>${id ? 'Editar Área' : 'Nueva Área'}</h2>
    <form id="form-area" onsubmit="event.preventDefault(); guardarArea();">
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="area-nombre" value="${nombre}" required>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="area-desc">${descripcion}</textarea>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Área'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-area')">Cancelar</button>
      </div>
    </form>
  `;

  document.getElementById('modal-area').classList.remove('hidden');
}

async function guardarArea() {
  const nombre = document.getElementById('area-nombre').value.trim();
  const descripcion = document.getElementById('area-desc').value.trim();

  if (!nombre) { alert('El nombre es requerido'); return; }

  try {
    if (_editandoAreaId) {
      await fetch(`${API}/areas/${_editandoAreaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
    } else {
      await fetch(`${API}/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
    }

    cerrarModal('modal-area');
    loadAreas();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

/* ---------- Roles y Permisos CRUD ---------- */

const PERMISOS_LABELS = {
  ver_dashboard: 'Dashboard',
  ver_mapa: 'Mapa',
  ver_lista: 'Lista de Reportes',
  ver_catalogo: 'Catálogo CDMX',
  ver_usuarios: 'Usuarios',
  ver_tipos: 'Tipos de Inmueble',
  ver_areas: 'Áreas',
  ver_roles: 'Roles y Permisos',
  ver_alta_inmuebles: 'Alta Inmuebles',
  ver_mascaras: 'Máscaras de Folio',
};

let _editandoRolId = null;

async function loadRoles() {
  const container = document.getElementById('roles-lista');
  try {
    const roles = await fetchJSON(`${API}/roles`);
    if (roles.length === 0) {
      container.innerHTML = '<p style="color:#777;">No hay roles registrados.</p>';
      return;
    }
    container.innerHTML = roles.map(r => {
      const permisosLista = (r.permisos || []).map(p => PERMISOS_LABELS[p] || p).join(', ');
      return `
      <div class="tipo-card ${r.activo ? '' : 'inactivo'}">
        <div>
          <div class="tipo-nombre">${r.nombre}</div>
          <div class="tipo-desc">${r.descripcion || 'Sin descripción'}</div>
          <div class="tipo-meta">Permisos: ${permisosLista || 'Ninguno'} · ${r.activo ? 'Activo' : 'Inactivo'}</div>
        </div>
        <div class="acciones">
          <label class="switch">
            <input type="checkbox" ${r.activo ? 'checked' : ''} onchange="toggleActivoRol('${r._id}', this.checked)">
            <span class="slider"></span>
          </label>
          <button class="btn-sm" onclick="abrirFormRol('${r._id}')">✏️</button>
          <button class="btn-danger" onclick="eliminarRol('${r._id}')">🗑</button>
        </div>
      </div>
    `}).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error: ${err.message}</p>`;
  }
}

async function toggleActivoRol(id, activo) {
  try {
    await fetch(`${API}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    });
    loadRoles();
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

async function eliminarRol(id) {
  if (!confirm('¿Eliminar este rol?')) return;
  try {
    const res = await fetch(`${API}/roles/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    loadRoles();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

async function abrirFormRol(id) {
  _editandoRolId = id || null;
  const body = document.getElementById('modal-rol-body');

  let nombre = '', descripcion = '', permisos = [];

  if (id) {
    const r = await fetchJSON(`${API}/roles/${id}`);
    nombre = r.nombre || '';
    descripcion = r.descripcion || '';
    permisos = r.permisos || [];
  }

  const permisosCheckboxes = Object.entries(PERMISOS_LABELS).map(([key, label]) => `
    <label class="permiso-checkbox">
      <input type="checkbox" name="permiso" value="${key}" ${permisos.includes(key) ? 'checked' : ''}>
      <span>${label}</span>
    </label>
  `).join('');

  body.innerHTML = `
    <h2>${id ? 'Editar Rol' : 'Nuevo Rol'}</h2>
    <form id="form-rol" onsubmit="event.preventDefault(); guardarRol();">
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="rol-nombre" value="${nombre}" required>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="rol-desc">${descripcion}</textarea>
      </div>
      <div class="form-group">
        <label>Permisos (pestañas que puede ver)</label>
        <div class="permisos-grid">
          ${permisosCheckboxes}
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Rol'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-rol')">Cancelar</button>
      </div>
    </form>
  `;

  document.getElementById('modal-rol').classList.remove('hidden');
}

async function guardarRol() {
  const nombre = document.getElementById('rol-nombre').value.trim();
  const descripcion = document.getElementById('rol-desc').value.trim();
  const permisos = Array.from(document.querySelectorAll('input[name="permiso"]:checked')).map(cb => cb.value);

  if (!nombre) { alert('El nombre es requerido'); return; }

  try {
    if (_editandoRolId) {
      await fetch(`${API}/roles/${_editandoRolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion, permisos }),
      });
    } else {
      await fetch(`${API}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion, permisos }),
      });
    }

    cerrarModal('modal-rol');
    loadRoles();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

/* ---------- Ubicación Filtros ---------- */

document.getElementById('ubic-alcaldia').addEventListener('change', filtrarUbicacion);
document.getElementById('ubic-colonia').addEventListener('change', filtrarUbicacion);
document.getElementById('ubic-cp').addEventListener('input', filtrarUbicacion);
document.getElementById('ubic-dano').addEventListener('change', filtrarUbicacion);

document.getElementById('modal-inmueble-padron').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-inmueble-padron');
});

document.getElementById('padron-search').addEventListener('input', (e) => {
  loadInmueblesPadron(e.target.value);
});

/* ---------- Inmuebles Padrón CRUD ---------- */

let _padronData = [];

async function loadInmueblesPadron(filter = '') {
  const container = document.getElementById('padron-lista');
  const countEl = document.getElementById('padron-count');
  container.innerHTML = '<p style="color:#777;">Cargando...</p>';

  try {
    const inmuebles = await fetchJSON(`${API}/inmuebles-padron`);
    _padronData = inmuebles;

    const alcaldiaSelect = document.getElementById('padron-alcaldia');
    const alcaldias = [...new Set(inmuebles.map(i => i.alcaldia).filter(Boolean))].sort();
    alcaldiaSelect.innerHTML = '<option value="">Todas las alcaldías</option>' +
      alcaldias.map(a => `<option value="${a}">${a}</option>`).join('');

    let filtered = inmuebles;
    if (filter) {
      const q = filter.toLowerCase();
      filtered = inmuebles.filter(i =>
        (i.nombre || '').toLowerCase().includes(q) ||
        (i.colonia || '').toLowerCase().includes(q) ||
        (i.direccion || '').toLowerCase().includes(q) ||
        (i.alcaldia || '').toLowerCase().includes(q)
      );
    }

    countEl.textContent = `${filtered.length} inmueble(s) registrado(s)`;

    if (filtered.length === 0) {
      container.innerHTML = '<p style="color:#777;">No hay inmuebles registrados. Usa "+ Nuevo Inmueble" para agregar uno.</p>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <thead>
            <tr style="background:#1a237e;color:#fff;text-align:left;">
              <th style="padding:0.6rem;">Nombre</th>
              <th style="padding:0.6rem;">Dirección</th>
              <th style="padding:0.6rem;">Colonia</th>
              <th style="padding:0.6rem;">Alcaldía</th>
              <th style="padding:0.6rem;">CP</th>
              <th style="padding:0.6rem;">Niveles</th>
              <th style="padding:0.6rem;">Último Reporte</th>
              <th style="padding:0.6rem;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(i => {
      const ultimoReporte = i.fecha_ultimo_reporte
        ? formatDate(i.fecha_ultimo_reporte)
        : '<span style="color:#999;">Sin reportes</span>';
      return `
                <tr style="border-bottom:1px solid #e0e0e0;">
                  <td style="padding:0.5rem;font-weight:600;">${i.nombre || '—'}</td>
                  <td style="padding:0.5rem;">${i.direccion || '—'}</td>
                  <td style="padding:0.5rem;">${i.colonia || '—'}</td>
                  <td style="padding:0.5rem;">${i.alcaldia || '—'}</td>
                  <td style="padding:0.5rem;">${i.codigo_postal || '—'}</td>
                  <td style="padding:0.5rem;text-align:center;">${i.niveles || 1}</td>
                  <td style="padding:0.5rem;">${ultimoReporte}</td>
                  <td style="padding:0.5rem;">
                    <button class="btn-sm" onclick="abrirFormInmueblePadron('${i._id}')" title="Editar">✏️</button>
                    <button class="btn-danger" onclick="eliminarInmueblePadron('${i._id}')" title="Eliminar">🗑</button>
                  </td>
                </tr>`;
    }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error al cargar: ${err.message}</p>`;
  }
}

async function abrirFormInmueblePadron(id) {
  const body = document.getElementById('modal-inmueble-padron-body');
  let inm = {};
  let tipos = [];
  let caracts = [];
  try {
    tipos = await fetchJSON(`${API}/tipos-inmueble?activos=true`);
    if (tipos.length > 0) {
      caracts = await fetchJSON(`${API}/tipos-inmueble/${tipos[0]._id}/caracteristicas`);
    }
  } catch { }

  if (id) {
    try { inm = await fetchJSON(`${API}/inmuebles-padron/${id}`); } catch { }
  }

  const tiposOptions = tipos.map(t =>
    `<option value="${t._id}" ${inm.tipo_inmueble_ref === t._id ? 'selected' : ''}>${t.nombre}</option>`
  ).join('');

  const sec1 = caracts.filter(c => c.orden >= 1 && c.orden <= 14);
  const sec2 = caracts.filter(c => c.orden >= 20 && c.orden <= 40);
  const sec3 = caracts.filter(c => c.orden >= 40 && c.orden <= 50);
  const sec4 = caracts.filter(c => c.orden >= 50 && c.orden <= 60);
  const sec5 = caracts.filter(c => c.orden >= 60 && c.orden <= 70 && !c.nombre.includes('Fotograf'));

  function renderCampo(c) {
    if (c.tipo_dato === 'seleccion') {
      const esRadio3 = c.opciones.length === 3 &&
        c.opciones.includes('Sí') && c.opciones.includes('No') && c.opciones.includes('Existen dudas');
      const esRadio2 = c.opciones.length === 2 &&
        c.opciones.includes('Sí') && c.opciones.includes('No');
      if (esRadio3 || esRadio2) {
        return `
          <div class="form-group">
            <label style="font-weight:600;margin-bottom:0.3rem;display:block;">${c.nombre}</label>
            <div style="display:flex;gap:1rem;">
              ${c.opciones.map(o => `
                <label style="display:flex;align-items:center;gap:0.3rem;cursor:pointer;font-size:0.9rem;">
                  <input type="radio" name="caract-${c._id}" data-caract="${c._id}" value="${o}">
                  ${o}
                </label>
              `).join('')}
            </div>
          </div>`;
      }
      return `
        <div class="form-group">
          <label>${c.nombre}</label>
          <select data-caract="${c._id}" style="width:100%;">
            <option value="">Seleccione</option>
            ${c.opciones.map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>
        </div>`;
    }
    if (c.tipo_dato === 'texto') {
      return `
        <div class="form-group">
          <label>${c.nombre}</label>
          <input type="text" data-caract="${c._id}" style="width:100%;">
        </div>`;
    }
    if (c.tipo_dato === 'numero') {
      return `
        <div class="form-group">
          <label>${c.nombre}</label>
          <input type="number" data-caract="${c._id}" style="width:100%;">
        </div>`;
    }
    return '';
  }

  body.innerHTML = `
    <h2>${id ? 'Editar Inmueble' : 'Nuevo Inmueble en Padrón'}</h2>
    <form id="form-padron" onsubmit="event.preventDefault(); guardarInmueblePadron('${id || ''}');">
      <h3 style="margin:0 0 0.5rem;color:#7A0C38;">1. Ubicación y Descripción</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
        <div class="form-group" style="grid-column:1/3;">
          <label>Nombre / Descripción del inmueble</label>
          <input type="text" id="padron-nombre" value="${inm.nombre || ''}" required style="width:100%;">
        </div>
        <div class="form-group">
          <label>Tipo de inmueble</label>
          <select id="padron-tipo" style="width:100%;"><option value="">Seleccionar...</option>${tiposOptions}</select>
        </div>
        <div class="form-group">
          <label>Calle y Número</label>
          <input type="text" id="padron-direccion" value="${inm.direccion || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Colonia</label>
          <input type="text" id="padron-colonia" value="${inm.colonia || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Alcaldía</label>
          <input type="text" id="padron-alcaldia" value="${inm.alcaldia || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Código Postal</label>
          <input type="text" id="padron-cp" value="${inm.codigo_postal || ''}" maxlength="5" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Entre que calles / Referencia</label>
          <input type="text" id="padron-entre-calles" value="${inm.entre_calles || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Persona contactada</label>
          <input type="text" id="padron-contacto" value="${inm.persona_contactada || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Latitud</label>
          <input type="number" step="any" id="padron-lat" value="${inm.ubicacion?.coordinates?.[1] || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Longitud</label>
          <input type="number" step="any" id="padron-lng" value="${inm.ubicacion?.coordinates?.[0] || ''}" style="width:100%;">
        </div>
        <div class="form-group">
          <label>Uso del Inmueble</label>
          <select id="padron-uso" style="width:100%;">
            <option value="">Seleccione</option>
            ${['HABITACIÓN UNIFAMILIAR', 'HABITACIÓN MULTIFAMILIAR', 'CENTRO DE REUNIÓN', 'OFICINAS PRIVADAS', 'INDUSTRIAS', 'RECREATIVO', 'COMERCIOS', 'ESTACIONAMIENTO', 'EDUCACIÓN', 'OFICINAS PÚBLICAS', 'BODEGAS', 'MIXTO'].map(u =>
    `<option value="${u}" ${inm.uso_inmueble === u ? 'selected' : ''}>${u}</option>`
  ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Década de construcción</label>
          <select id="padron-decada" style="width:100%;">
            <option value="">Seleccione</option>
            ${['50S O ANTES', '60S', '70S', '80S', '90S', '2000S', '2010S O MÁS'].map(d =>
    `<option value="${d}" ${inm.decada_construccion === d ? 'selected' : ''}>${d}</option>`
  ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Niveles sobre terreno</label>
          <select id="padron-niveles" style="width:100%;">
            ${Array.from({ length: 100 }, (_, i) => `<option value="${i + 1}" ${(inm.niveles || 1) === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Sótanos</label>
          <select id="padron-sotanos" style="width:100%;">
            ${Array.from({ length: 100 }, (_, i) => `<option value="${i}" ${(inm.sotanos || 0) === i ? 'selected' : ''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de inspección</label>
          <select id="padron-inspeccion" style="width:100%;">
            <option value="">Seleccione</option>
            ${['INSPECCIÓN EXTERIOR ÚNICAMENTE', 'INSPECCIÓN INTERIOR Y EXTERIOR'].map(t =>
    `<option value="${t}" ${inm.tipo_inspeccion === t ? 'selected' : ''}>${t}</option>`
  ).join('')}
          </select>
        </div>
      </div>
      ${sec2.length > 0 ? '<h3 style="margin:1rem 0 0.5rem;color:#7A0C38;">2. Estado de la Edificación</h3>' : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
        ${sec2.map(c => renderCampo(c)).join('')}
      </div>
      ${sec3.length > 0 ? '<h3 style="margin:1rem 0 0.5rem;color:#7A0C38;">3. Clasificación Global</h3>' : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
        ${sec3.map(c => renderCampo(c)).join('')}
      </div>
      ${sec4.length > 0 ? '<h3 style="margin:1rem 0 0.5rem;color:#7A0C38;">4. Recomendaciones</h3>' : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
        ${sec4.map(c => renderCampo(c)).join('')}
      </div>
      ${sec5.length > 0 ? '<h3 style="margin:1rem 0 0.5rem;color:#7A0C38;">5. Observaciones</h3>' : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
        ${sec5.map(c => renderCampo(c)).join('')}
      </div>
      <div style="margin-top:1rem;">
        <label style="font-weight:600;display:block;margin-bottom:0.3rem;">5.2 Fotografías (incluyendo fachada) — máximo 10</label>
        <input type="file" id="padron-fotos" accept="image/*" multiple style="display:none;" onchange="previewFotosPadron(this)">
        <button type="button" class="btn-sm" onclick="document.getElementById('padron-fotos').click();">📷 Seleccionar imágenes</button>
        <div id="padron-fotos-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:0.5rem;"></div>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Inmueble'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-inmueble-padron')">Cancelar</button>
      </div>
    </form>
  `;

  document.getElementById('modal-inmueble-padron').classList.remove('hidden');
}

let _fotosPadron = [];

function previewFotosPadron(input) {
  const nuevos = Array.from(input.files);
  if (_fotosPadron.length + nuevos.length > 10) {
    alert('Máximo 10 imágenes. Ya tienes ' + _fotosPadron.length + '.');
    input.value = '';
    return;
  }
  _fotosPadron = _fotosPadron.concat(nuevos);
  renderFotosPadron();
  input.value = '';
}

function renderFotosPadron() {
  const container = document.getElementById('padron-fotos-preview');
  container.innerHTML = '';
  _fotosPadron.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;width:100px;height:100px;';
      div.innerHTML = `
        <img src="${e.target.result}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">
        <span style="position:absolute;top:-4px;right:-4px;background:#d32f2f;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;" onclick="_fotosPadron.splice(${i},1);renderFotosPadron();">✕</span>
      `;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

async function guardarInmueblePadron(editId) {
  const data = {
    nombre: document.getElementById('padron-nombre').value.trim(),
    tipo_inmueble_ref: document.getElementById('padron-tipo').value || null,
    uso_inmueble: document.getElementById('padron-uso').value,
    direccion: document.getElementById('padron-direccion').value.trim(),
    colonia: document.getElementById('padron-colonia').value.trim(),
    alcaldia: document.getElementById('padron-alcaldia').value.trim(),
    codigo_postal: document.getElementById('padron-cp').value.trim(),
    entre_calles: document.getElementById('padron-entre-calles').value.trim(),
    persona_contactada: document.getElementById('padron-contacto').value.trim(),
    lat: parseFloat(document.getElementById('padron-lat').value) || null,
    lng: parseFloat(document.getElementById('padron-lng').value) || null,
    niveles: parseInt(document.getElementById('padron-niveles').value) || 1,
    sotanos: parseInt(document.getElementById('padron-sotanos').value) || 0,
    decada_construccion: document.getElementById('padron-decada').value,
    tipo_inspeccion: document.getElementById('padron-inspeccion').value,
    valores_seguimiento: {},
  };

  document.querySelectorAll('#form-padron [data-caract]').forEach(el => {
    if (el.tagName === 'INPUT' && el.type === 'radio') {
      if (el.checked) data.valores_seguimiento[el.dataset.caract] = el.value;
    } else if (el.value) {
      data.valores_seguimiento[el.dataset.caract] = el.value;
    }
  });

  if (!data.nombre) { alert('El nombre es requerido'); return; }

  try {
    const url = editId ? `${API}/inmuebles-padron/${editId}` : `${API}/inmuebles-padron`;
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    cerrarModal('modal-inmueble-padron');
    loadInmueblesPadron();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

async function eliminarInmueblePadron(id) {
  if (!confirm('¿Eliminar este inmueble y todos sus reportes de seguimiento?')) return;
  try {
    await fetch(`${API}/inmuebles-padron/${id}`, { method: 'DELETE' });
    loadInmueblesPadron();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

function filtrarPadron() {
  const alcaldia = document.getElementById('padron-alcaldia').value;
  let filtered = _padronData;
  if (alcaldia) filtered = filtered.filter(i => i.alcaldia === alcaldia);
  const container = document.getElementById('padron-lista');
  const countEl = document.getElementById('padron-count');
  countEl.textContent = `${filtered.length} inmueble(s) encontrado(s)`;
  // Re-render with filtered data
  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:#777;">Sin resultados.</p>';
    return;
  }
  // Trigger full reload with current filter
  loadInmueblesPadron(document.getElementById('padron-search').value);
}

document.getElementById('padron-alcaldia').addEventListener('change', filtrarPadron);

/* ---------- Máscaras de Folio CRUD ---------- */

let _editandoMascaraId = null;

const TOKENS_INFO = [
  { token: '{prefijo}', desc: 'Prefijo de la máscara' },
  { token: '{aaaa}', desc: 'Año (4 dígitos)' },
  { token: '{mm}', desc: 'Mes (2 dígitos)' },
  { token: '{dd}', desc: 'Día (2 dígitos)' },
  { token: '{alcaldia}', desc: 'Alcaldía del reporte' },
  { token: '{seq}', desc: 'Secuencial sin padding' },
  { token: '{seq_padded}', desc: 'Secuencial con ceros (ej: 0001)' },
];

async function loadMascaras() {
  const container = document.getElementById('mascaras-lista');
  try {
    const mascaras = await fetchJSON(`${API}/mascaras-folio`);
    if (mascaras.length === 0) {
      container.innerHTML = '<p style="color:#777;">No hay máscaras registradas.</p>';
      return;
    }
    container.innerHTML = mascaras.map(m => `
      <div class="tipo-card ${m.activo ? '' : 'inactivo'}">
        <div>
          <div class="tipo-nombre">${m.nombre}</div>
          <div class="tipo-desc">${m.descripcion || 'Sin descripción'}</div>
          <div class="tipo-meta" style="margin-top:0.4rem;">
            <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:0.85rem;">${m.formato}</code>
          </div>
          <div class="tipo-meta">
            Aplica a: <strong>${m.aplica_a === 'ambos' ? 'Siniestros y Seguimiento' : m.aplica_a === 'siniestros' ? 'Siniestros' : 'Seguimiento'}</strong>
            &nbsp;|&nbsp; Secuencial actual: <strong>${m.secuencia_actual}</strong>
            &nbsp;|&nbsp; Longitud: <strong>${m.longitud_secuencia}</strong>
          </div>
          <div class="tipo-meta">${m.activo ? 'Activa' : 'Inactiva'}</div>
        </div>
        <div class="acciones">
          <label class="switch">
            <input type="checkbox" ${m.activo ? 'checked' : ''} onchange="toggleActivoMascara('${m._id}', this.checked)">
            <span class="slider"></span>
          </label>
          <button class="btn-sm" onclick="abrirFormMascara('${m._id}')">✏️</button>
          <button class="btn-danger" onclick="eliminarMascara('${m._id}')">🗑</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error: ${err.message}</p>`;
  }
}

async function toggleActivoMascara(id, activo) {
  try {
    await fetch(`${API}/mascaras-folio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    });
    loadMascaras();
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

async function eliminarMascara(id) {
  if (!confirm('¿Eliminar esta máscara?')) return;
  try {
    const res = await fetch(`${API}/mascaras-folio/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    loadMascaras();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

async function abrirFormMascara(id) {
  _editandoMascaraId = id || null;
  const body = document.getElementById('modal-mascara-body');

  let nombre = '', descripcion = '', formato = '{prefijo}-{aaaa}-{mm}-{seq_padded}', prefijo = '', longitud_secuencia = 4, aplica_a = 'ambos';

  if (id) {
    const m = await fetchJSON(`${API}/mascaras-folio/${id}`);
    nombre = m.nombre || '';
    descripcion = m.descripcion || '';
    formato = m.formato || '';
    prefijo = m.prefijo || '';
    longitud_secuencia = m.longitud_secuencia || 4;
    aplica_a = m.aplica_a || 'ambos';
  }

  body.innerHTML = `
    <h2>${id ? 'Editar Máscara' : 'Nueva Máscara'}</h2>
    <form id="form-mascara" onsubmit="event.preventDefault(); guardarMascara();">
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="mascara-nombre" value="${nombre}" required placeholder="Ej: Siniestros CDMX">
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="mascara-desc" placeholder="Descripción opcional">${descripcion}</textarea>
      </div>
      <div class="form-group">
        <label>Formato del folio</label>
        <input type="text" id="mascara-formato" value="${formato}" required placeholder="{prefijo}-{aaaa}-{mm}-{seq_padded}">
        <div style="margin-top:0.4rem;font-size:0.8rem;color:#666;">
          Tokens disponibles: ${TOKENS_INFO.map(t => `<code style="background:#e8e8e8;padding:1px 4px;border-radius:3px;cursor:pointer;" onclick="insertarToken('${t.token}')">${t.token}</code> <span style="color:#999;">${t.desc}</span>`).join(' &nbsp; ')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div class="form-group">
          <label>Prefijo (valor para {prefijo})</label>
          <input type="text" id="mascara-prefijo" value="${prefijo}" placeholder="Ej: SIS">
        </div>
        <div class="form-group">
          <label>Longitud del secuencial</label>
          <input type="number" id="mascara-longitud" value="${longitud_secuencia}" min="1" max="10">
          <div style="font-size:0.75rem;color:#999;">Ej: 4 genera 0001, 5 genera 00001</div>
        </div>
      </div>
      <div class="form-group">
        <label>Aplica a</label>
        <select id="mascara-aplica">
          <option value="ambos" ${aplica_a === 'ambos' ? 'selected' : ''}>Siniestros y Seguimiento</option>
          <option value="siniestros" ${aplica_a === 'siniestros' ? 'selected' : ''}>Solo Siniestros (móvil)</option>
          <option value="seguimiento" ${aplica_a === 'seguimiento' ? 'selected' : ''}>Solo Seguimiento</option>
        </select>
      </div>
      ${id ? `
      <div class="form-group">
        <label>Secuencial actual</label>
        <input type="number" id="mascara-secuencia" value="${m?.secuencia_actual || 0}" min="0">
        <div style="font-size:0.75rem;color:#999;">Último número generado. Solo editar si es necesario.</div>
      </div>` : ''}
      <div style="display:flex;gap:0.5rem;margin-top:1rem;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Máscara'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-mascara')">Cancelar</button>
      </div>
    </form>
  `;

  document.getElementById('modal-mascara').classList.remove('hidden');
}

function insertarToken(token) {
  const input = document.getElementById('mascara-formato');
  const pos = input.selectionStart;
  const before = input.value.substring(0, pos);
  const after = input.value.substring(pos);
  input.value = before + token + after;
  input.focus();
  input.setSelectionRange(pos + token.length, pos + token.length);
}

async function guardarMascara() {
  const nombre = document.getElementById('mascara-nombre').value.trim();
  const descripcion = document.getElementById('mascara-desc').value.trim();
  const formato = document.getElementById('mascara-formato').value.trim();
  const prefijo = document.getElementById('mascara-prefijo').value.trim();
  const longitud_secuencia = parseInt(document.getElementById('mascara-longitud').value) || 4;
  const aplica_a = document.getElementById('mascara-aplica').value;

  if (!nombre) { alert('El nombre es requerido'); return; }
  if (!formato) { alert('El formato es requerido'); return; }

  const data = { nombre, descripcion, formato, prefijo, longitud_secuencia, aplica_a };

  if (_editandoMascaraId) {
    const secEl = document.getElementById('mascara-secuencia');
    if (secEl) data.secuencia_actual = parseInt(secEl.value) || 0;
  }

  try {
    if (_editandoMascaraId) {
      await fetch(`${API}/mascaras-folio/${_editandoMascaraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch(`${API}/mascaras-folio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    cerrarModal('modal-mascara');
    loadMascaras();
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}
