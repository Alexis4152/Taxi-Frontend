import * as geocodingApi from '../api/geocoding'

// Cache en memoria (por sesion de pestaña) para no volver a pedir la misma direccion o las
// mismas coordenadas al backend - el geocodificador publico (Nominatim) no debe tratarse como
// ilimitado. Un Map simple con limite de tamaño alcanza para el uso de una sesion.
const MAX_ENTRIES = 100
const forwardCache = new Map()
const reverseCache = new Map()

function rememberEntry(cache, key, value) {
  if (cache.size >= MAX_ENTRIES) {
    cache.delete(cache.keys().next().value)
  }
  cache.set(key, value)
}

function normalize(text) {
  return text.trim().toLowerCase()
}

function roundCoord(n) {
  return Math.round(n * 10000) / 10000
}

export async function searchAddress(query) {
  const key = normalize(query)
  if (forwardCache.has(key)) return forwardCache.get(key)

  const { data } = await geocodingApi.searchAddress(query)
  rememberEntry(forwardCache, key, data.data)
  return data.data
}

export async function reverseGeocode(lat, lng) {
  const key = `${roundCoord(lat)},${roundCoord(lng)}`
  if (reverseCache.has(key)) return reverseCache.get(key)

  const { data } = await geocodingApi.reverseGeocode(lat, lng)
  rememberEntry(reverseCache, key, data.data.address)
  return data.data.address
}

/**
 * Debounce generico: retrasa la ejecucion hasta que dejan de llegar llamadas por `wait` ms.
 * Se usa para no geocodificar mientras el usuario todavia esta escribiendo.
 */
export function debounce(fn, wait) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        fn(...args).then(resolve, reject)
      }, wait)
    })
  }
}
