const API = '/api';

let allSiniestros = [];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getBadgeClass(color) {
  if (color === 'red') return 'badge red';
  if (color === 'yellow') return 'badge yellow';
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

async function loadDashboard() {
  try {
    const stats = await fetchJSON(`${API}/resumen`);
    document.getElementById('stat-fallecidos').textContent = stats.fallecidos || 0;
    document.getElementById('stat-lesionados-grave').textContent = stats.lesionadosGrave || 0;
    document.getElementById('stat-lesionados-leve').textContent = stats.lesionadosLeve || 0;
    document.getElementById('stat-ilesos').textContent = stats.ilesos || 0;
    document.getElementById('stat-inmuebles-criticos').textContent = stats.inmueblesCriticos || 0;
    document.getElementById('stat-inmuebles-moderados').textContent = stats.inmueblesModerados || 0;
    document.getElementById('stat-inmuebles-sin-danos').textContent = stats.inmueblesSinDanos || 0;
    document.getElementById('stat-total-siniestros').textContent = stats.totalSiniestros || 0;
  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
}

async function loadReportesList(filter = '') {
  const container = document.getElementById('reportes-lista');
  try {
    const mapaData = await fetchJSON(`${API}/mapa`);
    allSiniestros = mapaData;
    const filtered = filter
      ? mapaData.filter((s) =>
        (s.folio || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.ubicacion?.direccion || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.ubicacion?.municipio || '').toLowerCase().includes(filter.toLowerCase())
      )
      : mapaData;

    if (filtered.length === 0) {
      container.innerHTML = '<p style="color:#777;">No se encontraron reportes.</p>';
      return;
    }

    container.innerHTML = filtered
      .map(
        (s) => `
          <div class="reporte-card" data-id="${s._id}">
            <div>
              <div class="folio">${s.folio || 'Sin folio'}</div>
              <div class="fecha">${formatDate(s.fecha)}</div>
              <div class="ubicacion">${s.ubicacion?.direccion || ''} ${s.ubicacion?.municipio || ''}</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.8rem;">
              <span>${s.totalDamnificados} damnificados</span>
              <span class="${getBadgeClass(s.color)}">${s.color === 'red' ? 'Crítico' : s.color === 'yellow' ? 'Moderado' : 'Sin daños'}</span>
            </div>
          </div>`
      )
      .join('');

    container.querySelectorAll('.reporte-card').forEach((el) => {
      el.addEventListener('click', () => showDetail(el.dataset.id));
    });
  } catch (err) {
    container.innerHTML = '<p style="color:#d32f2f;">Error al cargar reportes.</p>';
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
      <h2>${siniestro.folio || 'Sin folio'}</h2>
      <p><strong>Fecha:</strong> ${formatDate(siniestro.fecha)}</p>
      <p><strong>Dirección:</strong> ${siniestro.ubicacion?.direccion || ''}, ${siniestro.ubicacion?.municipio || ''}, ${siniestro.ubicacion?.estado || ''}</p>
      <p><strong>Coordenadas:</strong> ${siniestro.ubicacion?.lat}, ${siniestro.ubicacion?.lng}</p>
      <p><strong>Descripción:</strong> ${siniestro.descripcion || 'Sin descripción'}</p>
      ${siniestro.dispositivo_id ? `<p><strong>Dispositivo:</strong> ${siniestro.dispositivo_id}</p>` : ''}
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

        html += `
          <div style="background:#f8f9fa;padding:0.8rem;border-radius:8px;margin:0.5rem 0;">
            <p><strong>${inm.tipo === 'edificio' ? 'Edificio' : 'Casa'}</strong>
              ${inm.identificador ? `- ${inm.identificador}` : ''}
              <span class="${getBadgeClass(inm.estado_afectacion === 'critico' ? 'red' : inm.estado_afectacion === 'moderado' ? 'yellow' : 'green')}" style="margin-left:0.5rem;">
                ${inm.estado_afectacion === 'critico' ? 'Crítico' : inm.estado_afectacion === 'moderado' ? 'Moderado' : 'Sin daños'}
              </span>
            </p>
            <p style="font-size:0.9rem;color:#555;">Sobre banqueta: ${inm.sobre_nivel_banqueta ?? 0} | Bajo banqueta: ${inm.bajo_nivel_banqueta ?? 0} | Niveles totales: ${(inm.sobre_nivel_banqueta ?? 0) + (inm.bajo_nivel_banqueta ?? 0)}${inm.tipo_unidad ? ` | Tipo: ${inm.tipo_unidad}` : ''}</p>
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
          return `<tr><td>${nombre}</td><td>${valor}</td></tr>`;
        }).join('')}
                </table>
              </div>
            ` : ''}
            ${damnificados.length > 0 ? `
              <p style="font-weight:600;margin-top:0.5rem;font-size:0.9rem;">Damnificados (${damnificados.length}):</p>
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
              </table>
            ` : '<p style="font-size:0.9rem;color:#999;">Sin damnificados registrados</p>'}

            ${hijos.length > 0 ? `
              <p style="font-weight:600;margin-top:0.5rem;">Departamentos/Unidades (${hijos.length}):</p>
              ${hijos.map(h => `
                <div style="background:#fff;padding:0.5rem;border-radius:6px;margin:0.3rem 0;border-left:3px solid ${h.estado_afectacion === 'critico' ? '#d32f2f' : h.estado_afectacion === 'moderado' ? '#f57c00' : '#388e3c'};">
                  <p><strong>${h.identificador || 'Unidad'}</strong> - ${h.estado_afectacion === 'critico' ? 'Crítico' : h.estado_afectacion === 'moderado' ? 'Moderado' : 'Sin daños'}</p>
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

let _ubicData = [];

async function loadUbicacion() {
  const container = document.getElementById('ubic-resultados');
  const countEl = document.getElementById('ubic-count');
  container.innerHTML = '<p style="color:#777;">Cargando...</p>';

  try {
    const [data, filtros] = await Promise.all([
      fetchJSON(`${API}/ubicacion`),
      fetchJSON(`${API}/ubicacion/filtros`),
    ]);

    _ubicData = data;

    const alcaldiaSelect = document.getElementById('ubic-alcaldia');
    const coloniaSelect = document.getElementById('ubic-colonia');
    const currentAlcaldia = alcaldiaSelect.value;
    const currentColonia = coloniaSelect.value;

    alcaldiaSelect.innerHTML = '<option value="">Todas las alcaldías</option>' +
      filtros.alcaldias.map(a => `<option value="${a}" ${a === currentAlcaldia ? 'selected' : ''}>${a}</option>`).join('');
    coloniaSelect.innerHTML = '<option value="">Todas las colonias</option>' +
      filtros.colonias.map(c => `<option value="${c}" ${c === currentColonia ? 'selected' : ''}>${c}</option>`).join('');

    renderUbicacion(data, countEl, container);
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Error al cargar: ${err.message}</p>`;
  }
}

function renderUbicacion(data, countEl, container) {
  countEl.textContent = `${data.length} registro(s) encontrado(s)`;

  if (data.length === 0) {
    container.innerHTML = '<p style="color:#777;">No se encontraron inmuebles con los filtros seleccionados.</p>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead>
          <tr style="background:#1a237e;color:#fff;text-align:left;">
            <th style="padding:0.6rem;">Folio</th>
            <th style="padding:0.6rem;">Fecha</th>
            <th style="padding:0.6rem;">Alcaldía</th>
            <th style="padding:0.6rem;">Colonia</th>
            <th style="padding:0.6rem;">CP</th>
            <th style="padding:0.6rem;">Uso</th>
            <th style="padding:0.6rem;">Niveles</th>
            <th style="padding:0.6rem;">Estado</th>
            <th style="padding:0.6rem;">Tipo daño</th>
            <th style="padding:0.6rem;">Damnificados</th>
            <th style="padding:0.6rem;">Fallecidos</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(d => {
    const estadoColor = d.estadoAfectacion === 'critico' ? '#d32f2f' : d.estadoAfectacion === 'moderado' ? '#f57c00' : '#388e3c';
    const estadoLabel = d.estadoAfectacion === 'critico' ? 'Crítico' : d.estadoAfectacion === 'moderado' ? 'Moderado' : 'Sin daños';
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
                <td style="padding:0.5rem;">${d.tipoDanio || '—'}</td>
                <td style="padding:0.5rem;text-align:center;">${d.totalDamnificados}</td>
                <td style="padding:0.5rem;text-align:center;${d.fallecidos > 0 ? 'color:#d32f2f;font-weight:700;' : ''}">${d.fallecidos}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filtrarUbicacion() {
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

document.querySelector('#modal .close').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.target.classList.add('hidden');
});

document.querySelectorAll('nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active');

    if (btn.dataset.view === 'dashboard') loadDashboard();
    if (btn.dataset.view === 'lista') loadReportesList();
    if (btn.dataset.view === 'ubicacion') loadUbicacion();
    if (btn.dataset.view === 'mapa') setTimeout(initMap, 100);
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
  } catch (err) {
    errorEl.textContent = 'Error de conexión al servidor';
    errorEl.style.display = '';
  }
}

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('dashboard_user');
  actualizarHeaderAuth();
});

document.getElementById('modal-login').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal('modal-login');
});

actualizarHeaderAuth();

document.getElementById('search-input').addEventListener('input', (e) => {
  loadReportesList(e.target.value);
});

loadDashboard();
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

document.querySelectorAll('nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'tipos') setTimeout(loadTipos, 50);
    if (btn.dataset.view === 'catalogo') setTimeout(loadCatalogo, 50);
    if (btn.dataset.view === 'usuarios') setTimeout(loadUsuarios, 50);
    if (btn.dataset.view === 'areas') setTimeout(loadAreas, 50);
    if (btn.dataset.view === 'roles') setTimeout(loadRoles, 50);
    if (btn.dataset.view === 'alta-inmuebles') setTimeout(loadInmueblesPadron, 50);
  });
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
    container.innerHTML = await Promise.all(tipos.map(async (t) => {
      const caracts = await fetchJSON(`${API}/tipos-inmueble/${t._id}/caracteristicas`);
      return `
        <div class="tipo-card ${t.activo ? '' : 'inactivo'}">
          <div>
            <div class="tipo-nombre">${t.nombre}</div>
            <div class="tipo-desc">${t.descripcion || 'Sin descripción'}</div>
            <div class="tipo-meta">${caracts.length} característica(s) · ${t.activo ? 'Activo' : 'Inactivo'}</div>
          </div>
          <div class="acciones">
            <label class="switch">
              <input type="checkbox" ${t.activo ? 'checked' : ''} onchange="toggleActivo('${t._id}', this.checked)">
              <span class="slider"></span>
            </label>
            <button class="btn-sm" onclick="abrirFormTipo('${t._id}')">✏️</button>
            <button class="btn-danger" onclick="eliminarTipo('${t._id}')">🗑</button>
          </div>
        </div>`;
    })).then(r => r.join(''));
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
  container.innerHTML = _caractsTemp.map((c, i) => {
    const tipoLabel = { texto: 'Texto', numero: 'Número', booleano: 'Sí/No', seleccion: 'Selección', multiseleccion: 'Multiselección' };
    const td = c.tipoDato || c.tipo_dato || '';
    return `
      <div class="caract-item">
        <div class="caract-info">
          <div class="caract-nombre">${c.nombre}</div>
          <div class="caract-detalle">${tipoLabel[td] || td} ${c.requerido ? '· Requerido' : ''}              ${(td === 'seleccion' || td === 'multiseleccion') && c.opciones?.length ? ' · Opciones: ' + c.opciones.join(', ') : ''}</div>
        </div>
        <div class="caract-acciones">
          <button class="btn-sm" onclick="abrirFormCaract(${i})">✏️</button>
          <button class="btn-danger" onclick="eliminarCaract(${i})">🗑</button>
        </div>
      </div>`;
  }).join('');
}

function abrirFormCaract(idx) {
  const c = idx !== undefined ? _caractsTemp[idx] : { nombre: '', tipoDato: 'texto', opciones: [], requerido: false };
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
          <option value="numero" ${c.tipoDato === 'numero' ? 'selected' : ''}>Número</option>
          <option value="booleano" ${c.tipoDato === 'booleano' ? 'selected' : ''}>Sí/No</option>
            <option value="seleccion" ${c.tipoDato === 'seleccion' ? 'selected' : ''}>Selección</option>
            <option value="multiseleccion" ${c.tipoDato === 'multiseleccion' ? 'selected' : ''}>Multiselección</option>
        </select>
      </div>
      <div class="form-group checkbox" style="align-self:flex-end;">
        <input type="checkbox" id="caract-req" ${c.requerido ? 'checked' : ''}>
        <label>Requerido</label>
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
  form.insertBefore(section, form.querySelector('div:last-child'));
}

function onCaractTipoChange() {
  const tipo = document.getElementById('caract-tipo').value;
  const group = document.getElementById('caract-opciones-group');
  group.style.display = tipo === 'seleccion' || tipo === 'multiseleccion' ? '' : 'none';
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
  const opciones = tipoDato === 'seleccion' || tipoDato === 'multiseleccion'
    ? document.getElementById('caract-opciones').value.split('\n').map(s => s.trim()).filter(s => s)
    : [];

  const caract = { nombre, tipoDato, requerido, opciones };

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
      await fetch(`${API}/tipos-inmueble/${tipoId}/caracteristicas`, {
        method: 'DELETE'
      }).catch(() => { });

      for (const c of _caractsTemp) {
        await fetch(`${API}/tipos-inmueble/${tipoId}/caracteristicas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: c.nombre,
            tipo_dato: c.tipoDato,
            opciones: c.opciones,
            requerido: c.requerido,
            orden: _caractsTemp.indexOf(c),
          }),
        });
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
  } catch {}

  if (id) {
    try { inm = await fetchJSON(`${API}/inmuebles-padron/${id}`); } catch {}
  }

  const tiposOptions = tipos.map(t =>
    `<option value="${t._id}" ${inm.tipo_inmueble_ref === t._id ? 'selected' : ''}>${t.nombre}</option>`
  ).join('');

  const sec1 = caracts.filter(c => c.orden >= 1 && c.orden <= 14);
  const sec2 = caracts.filter(c => c.orden >= 20 && c.orden <= 40);
  const sec3 = caracts.filter(c => c.orden >= 40 && c.orden <= 50);
  const sec4 = caracts.filter(c => c.orden >= 50 && c.orden <= 60);
  const sec5 = caracts.filter(c => c.orden >= 60 && c.orden <= 70);

  function renderCampo(c) {
    if (c.tipo_dato === 'seleccion') {
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
            ${['HABITACIÓN UNIFAMILIAR','HABITACIÓN MULTIFAMILIAR','CENTRO DE REUNIÓN','OFICINAS PRIVADAS','INDUSTRIAS','RECREATIVO','COMERCIOS','ESTACIONAMIENTO','EDUCACIÓN','OFICINAS PÚBLICAS','BODEGAS','MIXTO'].map(u =>
              `<option value="${u}" ${inm.uso_inmueble === u ? 'selected' : ''}>${u}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Década de construcción</label>
          <select id="padron-decada" style="width:100%;">
            <option value="">Seleccione</option>
            ${['50S O ANTES','60S','70S','80S','90S','2000S','2010S O MÁS'].map(d =>
              `<option value="${d}" ${inm.decada_construccion === d ? 'selected' : ''}>${d}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Niveles sobre terreno</label>
          <select id="padron-niveles" style="width:100%;">
            ${Array.from({length:100}, (_,i) => `<option value="${i+1}" ${(inm.niveles || 1) === i+1 ? 'selected' : ''}>${i+1}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Sótanos</label>
          <select id="padron-sotanos" style="width:100%;">
            ${Array.from({length:100}, (_,i) => `<option value="${i}" ${(inm.sotanos || 0) === i ? 'selected' : ''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de inspección</label>
          <select id="padron-inspeccion" style="width:100%;">
            <option value="">Seleccione</option>
            ${['INSPECCIÓN EXTERIOR ÚNICAMENTE','INSPECCIÓN INTERIOR Y EXTERIOR'].map(t =>
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
      <div style="display:flex;gap:0.5rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;">
        <button type="submit" class="btn-primary">${id ? 'Guardar Cambios' : 'Crear Inmueble'}</button>
        <button type="button" class="btn-sm" onclick="cerrarModal('modal-inmueble-padron')">Cancelar</button>
      </div>
    </form>
  `;

  document.getElementById('modal-inmueble-padron').classList.remove('hidden');
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
    if (el.value) data.valores_seguimiento[el.dataset.caract] = el.value;
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
