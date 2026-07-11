let map = null;
let markersLayer = null;
let cdmxBoundaryLayer = null;
let cdmxMaskLayer = null;

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

function extraerAnillosCDMX(geojson) {
  const anillos = [];
  function recorrer(geom) {
    if (!geom) return;
    if (geom.type === 'Polygon') {
      anillos.push(geom.coordinates[0]);
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(p => anillos.push(p[0]));
    } else if (geom.type === 'GeometryCollection') {
      geom.geometries.forEach(recorrer);
    }
  }
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(f => recorrer(f.geometry));
  } else if (geojson.type === 'Feature') {
    recorrer(geojson.geometry);
  } else {
    recorrer(geojson);
  }
  return anillos;
}

function crearMascaraCDMX(geojson) {
  if (cdmxMaskLayer) {
    map.removeLayer(cdmxMaskLayer);
    cdmxMaskLayer = null;
  }

  const anillos = extraerAnillosCDMX(geojson);
  if (anillos.length === 0) return;

  const holesLngLat = anillos.map(ring => ring.map(c => [c[1], c[0]]));
  const world = [[-89, -180], [89, -180], [89, 180], [-89, 180], [-89, -180]];

  cdmxMaskLayer = L.polygon([world, ...holesLngLat], {
    color: '#111',
    fillColor: '#111',
    fillOpacity: 0.55,
    weight: 0,
    interactive: false,
  }).addTo(map);
}

function agregarLimiteCDMX(geojson) {
  cdmxBoundaryLayer = L.geoJSON(geojson, {
    style: { fillColor: '#616161', fillOpacity: 0.25, color: '#424242', weight: 3 },
  }).addTo(map);
  crearMascaraCDMX(geojson);
}

async function cargarLimiteCDMX() {
  if (cdmxBoundaryLayer) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const query = `[out:json];relation(1376330);out geom;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const geojson = osmtogeojson(data);
    agregarLimiteCDMX(geojson);
  } catch (err) {
    console.warn('Overpass falló, usando Nominatim:', err.message);
    try {
      const res2 = await fetch('https://nominatim.openstreetmap.org/lookup?osm_ids=R1376330&format=geojson&polygon_geojson=1');
      if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
      const data2 = await res2.json();
      agregarLimiteCDMX(data2);
    } catch (err2) {
      console.warn('No se pudo cargar el límite de CDMX:', err2.message);
    }
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
