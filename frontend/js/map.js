let map = null;
let markersLayer = null;
let cdmxBoundaryLayer = null;

function getMarkerColor(color) {
  if (color === 'red') return '#d32f2f';
  if (color === 'yellow') return '#fbc02d';
  return '#388e3c';
}

function createColoredIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
      <polygon points="6,22 16,32 26,22" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: '',
  });
}

async function cargarLimiteCDMX() {
  if (cdmxBoundaryLayer) return;
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/lookup?osm_ids=R1375350&format=geojson');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cdmxBoundaryLayer = L.geoJSON(data, {
      style: {
        fillColor: '#9e9e9e',
        fillOpacity: 0.15,
        color: '#757575',
        weight: 2,
      },
    }).addTo(map);
  } catch (err) {
    console.warn('No se pudo cargar el límite de CDMX:', err);
  }
}

async function initMap() {
  if (!map) {
    map = L.map('map').setView([19.4326, -99.1332], 10);
    cargarLimiteCDMX();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  }

  if (markersLayer) {
    markersLayer.clearLayers();
  } else {
    markersLayer = L.layerGroup().addTo(map);
  }

  try {
    const data = await fetchJSON('/api/mapa');
    const bounds = [];

    data.forEach((item) => {
      if (!item.ubicacion?.lat || !item.ubicacion?.lng) return;

      const lat = parseFloat(item.ubicacion.lat);
      const lng = parseFloat(item.ubicacion.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = getMarkerColor(item.color);
      const icon = createColoredIcon(color);

      const popupContent = `
        <div style="min-width:200px;">
          <h3 style="margin:0 0 0.3rem;color:#1a237e;">${item.folio || 'Sin folio'}</h3>
          <p style="margin:0.2rem 0;font-size:0.9rem;">${item.ubicacion.direccion || ''}</p>
          <p style="margin:0.2rem 0;font-size:0.9rem;"><strong>Damnificados:</strong> ${item.totalDamnificados}</p>
          <p style="margin:0.2rem 0;font-size:0.9rem;">
            <span style="color:#d32f2f;">● ${item.fallecidos} fallecidos</span>
            <span style="color:#f57c00;margin-left:0.5rem;">● ${item.lesionadosGrave} graves</span>
          </p>
          <p style="margin:0.2rem 0;font-size:0.9rem;"><strong>Inmuebles:</strong> ${item.totalInmuebles}</p>
          <button onclick="showDetail('${item._id}')" style="margin-top:0.5rem;padding:0.3rem 0.8rem;background:#1a237e;color:#fff;border:none;border-radius:4px;cursor:pointer;">
            Ver detalle
          </button>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon }).bindPopup(popupContent);
      markersLayer.addLayer(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  } catch (err) {
    console.error('Error cargando mapa:', err);
  }
}
