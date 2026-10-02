// Estilo de tiles vectoriales para MapLibre. Por defecto usa OpenFreeMap (gratis, sin API key,
// basado en OpenStreetMap). Cambiar de proveedor de mapas despues (MapTiler, Stadia, propio) es
// solo cambiar esta variable de entorno, sin tocar componentes.
export const MAP_STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty'

// Cada cuantos milisegundos, como maximo, se acepta una actualizacion de posicion GPS (pasajero u
// operador). No limita la precision del GPS del dispositivo, solo cuanto de seguido reaccionamos
// a ella (evita pings/renderizados excesivos).
export const LOCATION_UPDATE_INTERVAL_MS = Number(import.meta.env.VITE_LOCATION_UPDATE_MS) || 5000

// Cada cuanto se refresca la lista de "taxis disponibles cercanos" en el mapa del pasajero
// mientras arma su solicitud (no es tiempo real critico, por eso es un polling espaciado).
export const NEARBY_DRIVERS_POLL_MS = Number(import.meta.env.VITE_NEARBY_DRIVERS_POLL_MS) || 8000

// Cada cuanto se refresca el "Mapa en vivo" del super admin (ubicacion de todos los operadores
// conectados); igual de seguido que el ping de ubicacion del operador, para que se sienta en
// tiempo real sin pedirle al servidor mas de lo que en realidad cambia.
export const LIVE_MAP_POLL_MS = Number(import.meta.env.VITE_LIVE_MAP_POLL_MS) || 5000

// Centro con el que abre el mapa cuando todavia no hay ningun punto que mostrar (ej. "Mapa en
// vivo" sin operadores conectados aun). Por defecto Iguala de la Independencia, Guerrero, que es
// donde opera esta flotilla - cambia esto (o la variable de entorno) si se despliega en otra
// ciudad.
export const DEFAULT_MAP_CENTER = {
  lat: Number(import.meta.env.VITE_DEFAULT_MAP_LAT) || 18.3489,
  lng: Number(import.meta.env.VITE_DEFAULT_MAP_LNG) || -99.5392,
}
export const DEFAULT_MAP_ZOOM = Number(import.meta.env.VITE_DEFAULT_MAP_ZOOM) || 13
