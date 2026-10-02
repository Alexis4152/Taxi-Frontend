import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Flag, AlertCircle, Car } from 'lucide-react'
import { getPublicTrip } from '../api/trips'
import Logo from '../components/ui/Logo'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageLoader from '../components/ui/PageLoader'
import MapView from '../components/map/MapView'
import TripStatusStepper from '../components/TripStatusStepper'

const FINISHED_STATUSES = ['COMPLETED', 'CANCELLED']

export default function TrackTripPage() {
  const { shareToken } = useParams()
  const [trip, setTrip] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer = null

    const load = async () => {
      try {
        const { data } = await getPublicTrip(shareToken)
        if (cancelled) return
        setTrip(data.data)
        if (!FINISHED_STATUSES.includes(data.data.status)) {
          timer = setTimeout(load, 6000)
        }
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.message || 'No se pudo cargar el seguimiento de este viaje')
        setTrip(null)
      }
    }
    load()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [shareToken])

  if (trip === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <PageLoader />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center">
        <Logo />
        <div className="flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    )
  }

  const driver = trip.driverLat != null && trip.driverLng != null ? { lat: trip.driverLat, lng: trip.driverLng } : null
  const origin = { lat: trip.originLat, lng: trip.originLng }
  const destination = { lat: trip.destinationLat, lng: trip.destinationLng }

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <Logo />
          <Badge tone="brand">Seguimiento de viaje</Badge>
        </div>

        <Card padded={false} className="space-y-4 p-4">
          <TripStatusStepper status={trip.status} />

          <MapView origin={origin} destination={destination} driver={driver} routeGeometry={trip.routeGeometry} height="260px" />

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <p className="text-ink-700">{trip.originAddress}</p>
            </div>
            <div className="flex items-start gap-2">
              <Flag className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <p className="text-ink-700">{trip.destinationAddress}</p>
            </div>
          </div>

          {trip.driverName && (
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{trip.driverName}</p>
                <p className="text-xs text-ink-500">
                  {trip.taxiUnitNumber ? `Unidad ${trip.taxiUnitNumber}` : ''}
                  {trip.taxiPlates ? ` · ${trip.taxiPlates}` : ''}
                </p>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-ink-400">
          Este enlace muestra el seguimiento del viaje en tiempo real, sin acceso a la cuenta del pasajero.
        </p>
      </div>
    </div>
  )
}
