import { describe, expect, it, vi } from 'vitest'
import { LocationStatus, mapGeolocationError, watchPosition, isGeolocationSupported } from './locationService'

function makeError(code) {
  return { code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }
}

describe('mapGeolocationError', () => {
  it('mapea permiso denegado', () => {
    const result = mapGeolocationError(makeError(1))
    expect(result.status).toBe(LocationStatus.DENIED)
  })

  it('mapea GPS no disponible', () => {
    const result = mapGeolocationError(makeError(2))
    expect(result.status).toBe(LocationStatus.UNAVAILABLE)
  })

  it('mapea timeout como error recuperable', () => {
    const result = mapGeolocationError(makeError(3))
    expect(result.status).toBe(LocationStatus.ERROR)
  })
})

describe('watchPosition', () => {
  it('reporta UNAVAILABLE si el navegador no soporta geolocalizacion', () => {
    const originalGeolocation = globalThis.navigator?.geolocation
    vi.stubGlobal('navigator', {})

    const onStatusChange = vi.fn()
    watchPosition({ onPosition: vi.fn(), onStatusChange, intervalMs: 1000 })

    expect(onStatusChange).toHaveBeenCalledWith(LocationStatus.UNAVAILABLE, expect.any(String))
    expect(isGeolocationSupported()).toBe(false)

    if (originalGeolocation) vi.stubGlobal('navigator', { geolocation: originalGeolocation })
  })

  it('descarta actualizaciones de posicion mas seguidas que el intervalo configurado', () => {
    let successCallback
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: (onSuccess) => {
          successCallback = onSuccess
          return 1
        },
        clearWatch: vi.fn(),
      },
    })

    const onPosition = vi.fn()
    watchPosition({ onPosition, onStatusChange: vi.fn(), intervalMs: 5000 })

    const pos = (lat) => ({ coords: { latitude: lat, longitude: -99, heading: 0, accuracy: 5 } })
    successCallback(pos(19.1))
    successCallback(pos(19.2)) // deberia descartarse: llega antes de que pasen 5000ms

    expect(onPosition).toHaveBeenCalledTimes(1)
    expect(onPosition).toHaveBeenCalledWith(expect.objectContaining({ lat: 19.1 }))
  })
})
