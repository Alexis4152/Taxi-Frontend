import { MapPin, Flag, AlertTriangle } from 'lucide-react'
import Badge from './ui/Badge'

const STATUS_TONE = {
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_DRIVERS_AVAILABLE: 'warning',
  SCHEDULED: 'brand',
  SEARCHING: 'brand',
  ACCEPTED: 'info',
  IN_PROGRESS: 'info',
}

const STATUS_LABEL = {
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  NO_DRIVERS_AVAILABLE: 'Sin operadores',
  SCHEDULED: 'Programado',
  SEARCHING: 'Buscando',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En curso',
}

export default function TripHistoryRow({ trip, onReport }) {
  const when = trip.completedAt || trip.cancelledAt || trip.acceptedAt || trip.requestedAt
  const canReport = Boolean(onReport) && Boolean(trip.otherPartyName)
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge tone={STATUS_TONE[trip.status] || 'neutral'}>{STATUS_LABEL[trip.status] || trip.status}</Badge>
          {trip.status === 'COMPLETED' && !trip.rated && <Badge tone="warning">Pendiente de calificar</Badge>}
        </div>
        <span className="text-xs text-ink-400">{when ? new Date(when).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
      </div>
      <p className="flex items-center gap-1.5 text-ink-700">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> <span className="truncate">{trip.originAddress}</span>
      </p>
      <p className="flex items-center gap-1.5 text-ink-700">
        <Flag className="h-3.5 w-3.5 shrink-0 text-red-500" /> <span className="truncate">{trip.destinationAddress}</span>
      </p>
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>{trip.otherPartyName || '—'}</span>
        <span className="font-semibold text-ink-900">${trip.estimatedFare} MXN</span>
      </div>
      {canReport && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onReport(trip)
          }}
          className="flex items-center gap-1 text-[11px] font-medium text-ink-400 hover:text-red-600"
        >
          <AlertTriangle className="h-3 w-3" /> Reportar un problema
        </button>
      )}
    </div>
  )
}
