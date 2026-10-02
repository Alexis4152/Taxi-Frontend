import { describe, expect, it, vi } from 'vitest'
import * as routingApi from '../api/routing'
import { estimateRoute } from './routingService'

vi.mock('../api/routing')

describe('routingService cache', () => {
  it('no vuelve a pedir la ruta para el mismo par origen/destino', async () => {
    routingApi.estimateRoute.mockResolvedValue({
      data: { data: { distanceKm: 5, durationMin: 12, estimatedFare: 55, routeGeometry: [] } },
    })

    const points = { originLat: 19.111, originLng: -99.111, destinationLat: 19.222, destinationLng: -99.222 }
    await estimateRoute(points)
    await estimateRoute({ ...points })

    expect(routingApi.estimateRoute).toHaveBeenCalledTimes(1)
  })

  it('pide de nuevo si el destino cambia', async () => {
    routingApi.estimateRoute.mockResolvedValue({
      data: { data: { distanceKm: 3, durationMin: 8, estimatedFare: 40, routeGeometry: [] } },
    })

    await estimateRoute({ originLat: 20.1, originLng: -98.1, destinationLat: 20.2, destinationLng: -98.2 })
    await estimateRoute({ originLat: 20.1, originLng: -98.1, destinationLat: 20.3, destinationLng: -98.3 })

    expect(routingApi.estimateRoute).toHaveBeenCalledTimes(2)
  })
})
