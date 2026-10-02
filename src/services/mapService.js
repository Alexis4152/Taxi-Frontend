import { Map as MapLibreMap, Marker, NavigationControl, LngLatBounds, setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { MAP_STYLE_URL } from '../config'

// Unico punto de la app que conoce MapLibre. Componentes de UI nunca importan 'maplibre-gl'
// directamente ni llaman metodos del mapa: pasan por aqui. Si mañana se cambia MapLibre por otra
// libreria de render, solo este archivo deberia cambiar.

// MapLibre calcula la URL de su Web Worker (el que procesa los tiles vectoriales) a partir de
// `import.meta.url` en tiempo de ejecucion, construyendola con un template string en vez de la
// forma estatica `new Worker(new URL(..., import.meta.url))`. Ni Vite ni Rollup detectan ese
// patron dinamico, asi que nunca copian/sirven ese archivo del worker donde MapLibre lo espera:
// el worker nunca carga (404 silencioso, sin ningun error visible en el mapa) y el mapa se queda
// solo con el color de fondo del estilo, sin calles/edificios/agua. `?url` hace que Vite si
// resuelva y empaquete ese archivo como asset (en dev y en build), y setWorkerUrl le dice a
// MapLibre que lo use ahi en vez de intentar adivinar la ruta.
setWorkerUrl(maplibreWorkerUrl)

const ROUTE_SOURCE_ID = 'route'
const ROUTE_LAYER_ID = 'route-line'

const MARKER_STYLES = {
  user: { background: '#10b981', label: '' },
  'available-taxi': { background: '#94a3b8', label: '🚕' },
  'assigned-taxi': { background: '#2b84f5', label: '🚕' },
  destination: { background: '#ef4444', label: '📍' },
}

// Registro de marcadores por instancia de mapa, para poder mover uno solo (setLngLat) en vez de
// recrear/redibujar el mapa completo cuando solo cambio una posicion.
const markerRegistries = new WeakMap()

function registryFor(map) {
  if (!markerRegistries.has(map)) markerRegistries.set(map, new Map())
  return markerRegistries.get(map)
}

function buildMarkerElement(kind) {
  const style = MARKER_STYLES[kind] || MARKER_STYLES.user
  const el = document.createElement('div')
  el.style.width = '28px'
  el.style.height = '28px'
  el.style.borderRadius = '50%'
  el.style.background = style.background
  el.style.border = '3px solid white'
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.fontSize = '13px'
  el.textContent = style.label
  return el
}

/** Deteccion propia de soporte WebGL (esta version de MapLibre no expone un helper publico). */
export function isWebglSupported() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export function createMap(container, { center = [-99.1332, 19.4326], zoom = 13, styleUrl = MAP_STYLE_URL, onError } = {}) {
  const map = new MapLibreMap({
    container,
    style: styleUrl,
    center,
    zoom,
    attributionControl: { compact: true },
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

  if (onError) {
    // Sin esto, un estilo/tile/fuente que falla (CORS, 404, red) queda en silencio: el mapa se ve
    // "en blanco" sin ninguna pista de por que.
    map.on('error', (e) => onError(e?.error?.message || 'Error desconocido cargando el mapa'))
  }

  map.on('load', () => {
    if (map.getSource(ROUTE_SOURCE_ID)) return
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: emptyLineString() })
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.85 },
    })
  })

  return map
}

export function destroyMap(map) {
  markerRegistries.delete(map)
  map.remove()
}

/** Crea el marcador si no existe, o solo mueve su posicion si ya existia (sin re-renderizar nada). */
export function upsertMarker(map, id, { lng, lat, kind, onClick }) {
  const registry = registryFor(map)
  let marker = registry.get(id)
  if (!marker) {
    const element = buildMarkerElement(kind)
    if (onClick) element.addEventListener('click', onClick)
    marker = new Marker({ element }).setLngLat([lng, lat]).addTo(map)
    registry.set(id, marker)
  } else {
    marker.setLngLat([lng, lat])
  }
  return marker
}

export function removeMarker(map, id) {
  const registry = registryFor(map)
  const marker = registry.get(id)
  if (marker) {
    marker.remove()
    registry.delete(id)
  }
}

export function removeAllMarkers(map, predicate) {
  const registry = registryFor(map)
  for (const [id, marker] of registry.entries()) {
    if (!predicate || predicate(id)) {
      marker.remove()
      registry.delete(id)
    }
  }
}

function emptyLineString() {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} }
}

/** coordinates: lista de [lng, lat]. No reconstruye el mapa, solo actualiza los datos de la fuente. */
export function drawRoute(map, coordinates) {
  const source = map.getSource(ROUTE_SOURCE_ID)
  if (!source) return
  source.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} })
}

export function clearRoute(map) {
  const source = map.getSource(ROUTE_SOURCE_ID)
  if (source) source.setData(emptyLineString())
}

/** points: lista de {lat, lng}. Ignora nulos, no falla si hay menos de 2 puntos. */
export function fitToPoints(map, points, { padding = 60 } = {}) {
  const valid = points.filter(Boolean)
  if (valid.length === 0) return
  if (valid.length === 1) {
    map.easeTo({ center: [valid[0].lng, valid[0].lat], zoom: Math.max(map.getZoom(), 14) })
    return
  }
  const bounds = valid.reduce(
    (b, p) => b.extend([p.lng, p.lat]),
    new LngLatBounds([valid[0].lng, valid[0].lat], [valid[0].lng, valid[0].lat])
  )
  map.fitBounds(bounds, { padding, maxZoom: 16, duration: 500 })
}
