import * as routingApi from '../api/routing'

// Cache en memoria por sesion: si el usuario mueve el pin de destino de vuelta a un punto que ya
// habia consultado, o el componente vuelve a montarse con el mismo origen/destino, no se repite
// la llamada de red (el backend ya cachea tambien, esto ademas evita el round-trip HTTP).
const MAX_ENTRIES = 50
const cache = new Map()

function roundCoord(n) {
  return Math.round(n * 10000) / 10000
}

function cacheKey({ originLat, originLng, destinationLat, destinationLng }) {
  return [roundCoord(originLat), roundCoord(originLng), roundCoord(destinationLat), roundCoord(destinationLng)].join(',')
}

export async function estimateRoute(points) {
  const key = cacheKey(points)
  if (cache.has(key)) return cache.get(key)

  const { data } = await routingApi.estimateRoute(points)
  if (cache.size >= MAX_ENTRIES) {
    cache.delete(cache.keys().next().value)
  }
  cache.set(key, data.data)
  return data.data
}
