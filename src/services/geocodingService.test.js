import { describe, expect, it, vi } from 'vitest'
import * as geocodingApi from '../api/geocoding'
import { searchAddress, reverseGeocode, debounce } from './geocodingService'

vi.mock('../api/geocoding')

describe('geocodingService cache', () => {
  it('no vuelve a pedir la misma direccion (misma consulta, sin importar mayusculas/espacios)', async () => {
    geocodingApi.searchAddress.mockResolvedValue({
      data: { data: { lat: 19.4326, lng: -99.1332, displayName: 'Zocalo, CDMX' } },
    })

    await searchAddress('Zocalo Unico Test 1')
    await searchAddress('  zocalo unico test 1  ')

    expect(geocodingApi.searchAddress).toHaveBeenCalledTimes(1)
  })

  it('no vuelve a pedir la reversa de coordenadas casi identicas (redondeo)', async () => {
    geocodingApi.reverseGeocode.mockResolvedValue({ data: { data: { address: 'Av. Reforma, CDMX' } } })

    await reverseGeocode(19.5001, -99.5001)
    await reverseGeocode(19.50011, -99.50009)

    expect(geocodingApi.reverseGeocode).toHaveBeenCalledTimes(1)
  })

  it('si pasa el tiempo suficiente sin llegar mas llamadas, el debounce ejecuta la ultima', async () => {
    vi.useFakeTimers()
    const fn = vi.fn().mockResolvedValue('ok')
    const debounced = debounce(fn, 300)

    const p1 = debounced('a')
    const p2 = debounced('ab')
    const p3 = debounced('abc')

    await vi.advanceTimersByTimeAsync(300)
    await Promise.all([p3])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('abc')
    vi.useRealTimers()
    void p1
    void p2
  })
})
