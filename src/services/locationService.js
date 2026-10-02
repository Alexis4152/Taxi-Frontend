// Capa unica para hablar con el GPS del dispositivo. Los componentes/hooks nunca llaman a
// navigator.geolocation directamente: todos pasan por aqui, asi el manejo de permisos, errores
// y el throttle de actualizacion vive en un solo lugar.

export const LocationStatus = {
  IDLE: 'idle',
  PROMPTING: 'prompting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
}

export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

// Usa la Permissions API cuando el navegador la soporta, para saber de antemano si el permiso
// ya fue negado (y no tener que esperar a que watchPosition falle para saberlo).
export async function getPermissionState() {
  if (!isGeolocationSupported()) return LocationStatus.UNAVAILABLE
  if (!navigator.permissions?.query) return LocationStatus.IDLE // navegador sin Permissions API: no se puede saber sin preguntar
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    if (status.state === 'granted') return LocationStatus.GRANTED
    if (status.state === 'denied') return LocationStatus.DENIED
    return LocationStatus.IDLE
  } catch {
    return LocationStatus.IDLE
  }
}

export function mapGeolocationError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return { status: LocationStatus.DENIED, message: 'Permiso de ubicacion denegado. Actívalo en los ajustes del navegador.' }
    case error.POSITION_UNAVAILABLE:
      return { status: LocationStatus.UNAVAILABLE, message: 'No se pudo obtener tu ubicacion (GPS apagado o sin señal).' }
    case error.TIMEOUT:
      return { status: LocationStatus.ERROR, message: 'Tardamos demasiado en obtener tu ubicacion, intenta de nuevo.' }
    default:
      return { status: LocationStatus.ERROR, message: 'Ocurrio un error obteniendo tu ubicacion.' }
  }
}

/**
 * Observa la posicion del dispositivo, aceptando como maximo una actualizacion cada
 * `intervalMs` (el GPS puede reportar mucho mas seguido; aqui se descarta el exceso para no
 * disparar renders/pings de red innecesarios). Devuelve una funcion para detener el watch.
 */
export function watchPosition({ onPosition, onStatusChange, intervalMs }) {
  if (!isGeolocationSupported()) {
    onStatusChange?.(LocationStatus.UNAVAILABLE, 'Tu navegador no soporta geolocalizacion')
    return () => {}
  }

  onStatusChange?.(LocationStatus.PROMPTING)
  let lastAcceptedAt = 0

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const now = Date.now()
      if (now - lastAcceptedAt < intervalMs) return
      lastAcceptedAt = now
      onStatusChange?.(LocationStatus.GRANTED)
      onPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading,
        accuracy: pos.coords.accuracy,
      })
    },
    (error) => {
      const { status, message } = mapGeolocationError(error)
      onStatusChange?.(status, message)
    },
    { enableHighAccuracy: true, maximumAge: Math.min(intervalMs, 10000), timeout: 20000 }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
