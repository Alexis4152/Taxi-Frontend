import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Flag,
  Banknote,
  CreditCard,
  AlertCircle,
  Search,
  Star,
  Phone,
  XCircle,
  Navigation,
  Loader2,
  ListChecks,
  X,
  CalendarClock,
  MessageCircle,
  Share2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import * as passengerApi from '../api/passenger'
import Layout from '../components/Layout'
import MapView from '../components/map/MapView'
import RatingForm from '../components/RatingForm'
import RatingsModal from '../components/RatingsModal'
import CancelTripModal from '../components/CancelTripModal'
import ChatPanel from '../components/ChatPanel'
import { useConfirm } from '../components/ui/ConfirmDialog'
import DetailListModal from '../components/DetailListModal'
import TripHistoryRow from '../components/TripHistoryRow'
import TripStatusStepper from '../components/TripStatusStepper'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Switch from '../components/ui/Switch'
import { Label, Input, Textarea } from '../components/ui/Field'
import PageLoader from '../components/ui/PageLoader'
import EmptyState from '../components/ui/EmptyState'
import { useGeolocation } from '../hooks/useGeolocation'
import { useSubscription } from '../hooks/useSubscription'
import { useTripChat } from '../hooks/useTripChat'
import { useInactivityLogout } from '../hooks/useInactivityLogout'
import { useAuth } from '../context/AuthContext'
import { myActiveTripAsPassenger, myPassengerStats, myTripHistory, requestTrip, cancelTrip, nearbyDrivers } from '../api/trips'
import { reverseGeocode, searchAddress, debounce } from '../services/geocodingService'
import { estimateRoute } from '../services/routingService'
import { NEARBY_DRIVERS_POLL_MS } from '../config'

const STATUS_COPY = {
  SEARCHING: { label: 'Buscando un taxi cercano...', tone: 'brand' },
  ACCEPTED: { label: 'Un operador aceptó tu viaje', tone: 'success' },
  IN_PROGRESS: { label: 'Viaje en curso', tone: 'info' },
  COMPLETED: { label: 'Viaje finalizado', tone: 'success' },
  CANCELLED: { label: 'Viaje cancelado', tone: 'danger' },
  NO_DRIVERS_AVAILABLE: { label: 'No hay operadores disponibles cerca', tone: 'warning' },
}

const MAP_HEIGHT = 'clamp(240px, 42dvh, 420px)'
const API_URL = import.meta.env.VITE_API_URL || ''

const debouncedSearch = debounce(searchAddress, 500)

function ProfileSidebar({ profile, totalTrips, onOpenRatings, onOpenHistory }) {
  if (!profile) return null
  return (
    <Card className="text-center lg:text-left">
      <div className="flex flex-col items-center gap-3 lg:items-start">
        {profile.photoUrl ? (
          <img src={`${API_URL}${profile.photoUrl}`} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-900 text-2xl font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-base font-bold text-ink-900">{profile.name}</p>
          <button
            onClick={onOpenRatings}
            className="flex items-center justify-center gap-1 text-xs text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline lg:justify-start"
          >
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {profile.ratingAvg} ({profile.ratingCount})
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-left text-xs text-ink-600">
        <p className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" /> {profile.phone}
        </p>
        {totalTrips !== undefined && (
          <button onClick={onOpenHistory} className="flex items-center gap-2 hover:text-ink-900 hover:underline">
            <ListChecks className="h-3.5 w-3.5 shrink-0 text-ink-400" /> {totalTrips} viajes solicitados en total
          </button>
        )}
      </div>
    </Card>
  )
}

export default function PassengerHome() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { position, error: geoError } = useGeolocation(true)
  const [trip, setTrip] = useState(undefined) // undefined = cargando, null = sin viaje
  const [destination, setDestination] = useState(null)
  const [originAddress, setOriginAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [driverLive, setDriverLive] = useState(null)
  const [rated, setRated] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [nearby, setNearby] = useState([])
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ratingsOpen, setRatingsOpen] = useState(false)
  const [ratings, setRatings] = useState(null)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [showWelcome, setShowWelcome] = useState(Boolean(location.state?.justLoggedIn))
  const [manualOrigin, setManualOrigin] = useState(null)
  const [pickingField, setPickingField] = useState('destination')
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [tripOptionsOpen, setTripOptionsOpen] = useState(false)
  const [tripOptions, setTripOptions] = useState({ babySeat: false, moreThanFourPassengers: false, hasPet: false, comments: '' })
  const [chatOpen, setChatOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [tripHistory, setTripHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [tipGiven, setTipGiven] = useState(0)
  const geocodedOriginRef = useRef(false)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const loadStats = () => myPassengerStats().then(({ data }) => setStats(data.data)).catch(() => {})

  const openRatings = () => {
    setRatingsOpen(true)
    setRatingsLoading(true)
    passengerApi.myRatings().then(({ data }) => setRatings(data.data)).finally(() => setRatingsLoading(false))
  }

  const openHistory = () => {
    setHistoryOpen(true)
    setHistoryLoading(true)
    myTripHistory().then(({ data }) => setTripHistory(data.data)).finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    myActiveTripAsPassenger()
      .then(({ data }) => setTrip(data.data))
      .catch(() => setTrip(null))
    loadStats()
    const loadProfile = () => passengerApi.myProfile().then(({ data }) => setProfile(data.data)).catch(() => {})
    loadProfile()
    // El operador puede calificar al pasajero en cualquier momento despues de terminar un viaje -
    // sin este polling, la calificacion se quedaria desactualizada hasta cerrar sesion y volver a
    // entrar.
    const profileInterval = setInterval(loadProfile, 15000)
    return () => clearInterval(profileInterval)
  }, [])

  const gpsOrigin = position ? { lat: position.lat, lng: position.lng } : null
  const origin = manualOrigin || gpsOrigin

  // Reverse-geocode el origen una sola vez que tenemos GPS (el usuario puede editarlo despues, o
  // elegir otro punto de recogida en el mapa, que se geocodifica aparte mas abajo).
  useEffect(() => {
    if (!position || geocodedOriginRef.current) return
    geocodedOriginRef.current = true
    if (!manualOrigin) {
      reverseGeocode(position.lat, position.lng)
        .then((address) => setOriginAddress(address))
        .catch(() => setOriginAddress(`Mi ubicación (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position])

  // Reverse-geocode el punto de recogida cada vez que el pasajero elige uno distinto en el mapa.
  useEffect(() => {
    if (!manualOrigin) return
    reverseGeocode(manualOrigin.lat, manualOrigin.lng)
      .then((address) => setOriginAddress(address))
      .catch(() => setOriginAddress(`Punto de recogida (${manualOrigin.lat.toFixed(4)}, ${manualOrigin.lng.toFixed(4)})`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualOrigin?.lat, manualOrigin?.lng])

  // Reverse-geocode el destino cada vez que se elige un punto nuevo en el mapa.
  useEffect(() => {
    if (!destination) return
    reverseGeocode(destination.lat, destination.lng)
      .then((address) => setDestinationAddress(address))
      .catch(() => setDestinationAddress(`Destino (${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)})`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination?.lat, destination?.lng])

  // Ruta/tarifa preliminar en cuanto hay origen y destino, antes de solicitar el viaje.
  useEffect(() => {
    if (!origin || !destination) {
      setPreview(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    estimateRoute({
      originLat: origin.lat,
      originLng: origin.lng,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
    })
      .then((data) => !cancelled && setPreview(data))
      .catch(() => !cancelled && setError('No se pudo calcular la ruta, intenta de nuevo'))
      .finally(() => !cancelled && setPreviewLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng])

  // Taxis disponibles cercanos, mientras el pasajero arma su solicitud (no es tiempo real duro).
  useEffect(() => {
    if (!origin || trip) return
    let cancelled = false
    const poll = () => {
      nearbyDrivers(origin.lat, origin.lng)
        .then(({ data }) => !cancelled && setNearby(data.data))
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, NEARBY_DRIVERS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, Boolean(trip)])

  useSubscription(
    trip ? `/topic/trip/${trip.id}` : null,
    (updated) => {
      setTrip(updated)
      if (['COMPLETED', 'CANCELLED', 'NO_DRIVERS_AVAILABLE'].includes(updated.status)) setDriverLive(null)
    },
    Boolean(trip?.id)
  )

  useSubscription(
    trip && ['ACCEPTED', 'IN_PROGRESS'].includes(trip.status) ? `/topic/trip/${trip.id}/driver-location` : null,
    (loc) => setDriverLive({ lat: loc.lat, lng: loc.lng }),
    Boolean(trip?.id)
  )

  const chatEnabled = Boolean(trip && ['ACCEPTED', 'IN_PROGRESS'].includes(trip.status))
  const { messages: chatMessages, sendMessage: sendChatMessage, sending: chatSending, unreadCount: chatUnread, markAllRead } = useTripChat(
    trip?.id,
    chatEnabled,
    user.id,
    chatOpen
  )

  // Cierra la sesion sola tras 10 minutos sin actividad (solo pasajeros: un operador puede dejar
  // la pantalla quieta esperando viajes sin que eso cuente como "inactividad").
  useInactivityLogout(true, 10, () => {
    logout()
    navigate('/login')
  })

  // Cancela de verdad el viaje en el backend (no solo lo olvida en la pantalla) antes de volver al
  // inicio - si no, el viaje se queda "NO_DRIVERS_AVAILABLE" en el servidor y el reintento
  // automatico (radio ampliado) podria encontrarle operador despues de que el pasajero ya se fue.
  const giveUpOnNoDrivers = async () => {
    if (trip?.id) {
      await cancelTrip(trip.id, 'Sin operadores cercanos, el pasajero salió de la pantalla').catch(() => {})
    }
    setTrip(null)
    setDestination(null)
    setDestinationAddress('')
    setDestinationQuery('')
    setPreview(null)
  }

  // Si no hay operadores cerca, el backend reintenta solo con un radio de busqueda cada vez mas
  // amplio (ver DISPATCH_RETRY_MS); si en ese tiempo encuentra uno, el viaje vuelve a "buscando"
  // por si solo via WS y este timer se cancela. Si despues de varios intentos sigue sin exito,
  // se cancela el viaje de verdad (no solo se olvida en la pantalla) y regresa al inicio.
  useEffect(() => {
    if (trip?.status !== 'NO_DRIVERS_AVAILABLE') return
    const timer = setTimeout(giveUpOnNoDrivers, 25000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.status])

  const handleSearchDestination = async (query) => {
    setDestinationQuery(query)
    if (query.trim().length < 3) return
    setSearching(true)
    setSearchError('')
    try {
      const result = await debouncedSearch(query)
      setDestination({ lat: result.lat, lng: result.lng })
      setDestinationAddress(result.displayName)
      setDestinationQuery('')
    } catch (err) {
      setSearchError(err.response?.data?.message || 'No se encontró esa dirección')
    } finally {
      setSearching(false)
    }
  }

  const handleMapClick = (point) => {
    if (pickingField === 'origin') {
      setManualOrigin(point)
      setPickingField('destination')
    } else {
      setDestination(point)
      setDestinationQuery('')
    }
  }

  const handleUseCurrentLocation = () => {
    setManualOrigin(null)
    if (gpsOrigin) {
      reverseGeocode(gpsOrigin.lat, gpsOrigin.lng)
        .then((address) => setOriginAddress(address))
        .catch(() => setOriginAddress(`Mi ubicación (${gpsOrigin.lat.toFixed(4)}, ${gpsOrigin.lng.toFixed(4)})`))
    }
  }

  const canRequest = origin && destination && originAddress && destinationAddress && !submitting
  const tripOptionsCount = [tripOptions.babySeat, tripOptions.moreThanFourPassengers, tripOptions.hasPet].filter(Boolean).length

  const handleRequest = async () => {
    if (isScheduling && scheduledAt) {
      const ok = await confirm({
        title: '¿Programar este viaje?',
        message: 'Al programar este viaje te comprometes a estar disponible en el horario elegido. Un operador lo aceptará conforme se acerque la hora.',
        confirmLabel: 'Sí, programar',
      })
      if (!ok) return
    }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await requestTrip({
        originLat: origin.lat,
        originLng: origin.lng,
        originAddress,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationAddress,
        paymentMethod,
        scheduledAt: isScheduling && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        babySeat: tripOptions.babySeat,
        moreThanFourPassengers: tripOptions.moreThanFourPassengers,
        hasPet: tripOptions.hasPet,
        comments: tripOptions.comments || null,
      })
      setTrip(data.data)
      setRated(false)
      loadStats()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo solicitar el viaje')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShareTrip = async () => {
    if (!activeTrip?.shareToken) return
    const url = `${window.location.origin}/track/${activeTrip.shareToken}`
    const text = 'Estoy en un viaje con NexoraTaxis, aquí puedes seguirlo en tiempo real:'
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Seguir mi viaje - NexoraTaxis', text, url })
      } catch {
        // El usuario cancelo el dialogo nativo de compartir; no es un error a mostrar.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    } catch {
      setError('No se pudo copiar el enlace')
    }
  }

  const handleCancelTrip = async (reason) => {
    if (!trip) return
    setCancelBusy(true)
    try {
      const { data } = await cancelTrip(trip.id, reason || 'Cancelado por el pasajero')
      setTrip(data.data)
      setCancelOpen(false)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cancelar el viaje')
    } finally {
      setCancelBusy(false)
    }
  }

  const handleNewTrip = () => {
    setTrip(null)
    setDestination(null)
    setDestinationAddress('')
    setDestinationQuery('')
    setPreview(null)
    setRated(false)
    setTipGiven(0)
    setIsScheduling(false)
    setScheduledAt('')
    setTripOptions({ babySeat: false, moreThanFourPassengers: false, hasPet: false, comments: '' })
  }

  const mapDriver = useMemo(() => driverLive, [driverLive])

  if (trip === undefined) {
    return (
      <Layout title="Solicitar taxi">
        <PageLoader />
      </Layout>
    )
  }

  const scheduledTrip = trip && trip.status === 'SCHEDULED' ? trip : null
  const noDriversTrip = trip && trip.status === 'NO_DRIVERS_AVAILABLE' ? trip : null
  const activeTrip = trip && !scheduledTrip && !noDriversTrip && !['COMPLETED', 'CANCELLED'].includes(trip.status) ? trip : null
  const finishedTrip = trip && ['COMPLETED', 'CANCELLED'].includes(trip.status) ? trip : null

  let bottomBar = null
  if (!trip) {
    bottomBar = (
      <div className="space-y-2">
        {isScheduling && (
          <div className="flex items-center justify-between text-xs text-ink-600">
            <span>Se programará para:</span>
            <span className="font-semibold text-ink-900">
              {scheduledAt ? new Date(scheduledAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
            </span>
          </div>
        )}
        {preview && !previewLoading && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-600">
              {preview.distanceKm} km &middot; ~{Math.round(preview.durationMin)} min
            </span>
            <span className="font-bold text-ink-900">${preview.estimatedFare} MXN</span>
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button
          variant="brand"
          size="lg"
          icon={isScheduling ? CalendarClock : Search}
          loading={submitting}
          disabled={!canRequest || (isScheduling && !scheduledAt)}
          onClick={handleRequest}
          className="w-full"
        >
          {submitting ? 'Solicitando...' : isScheduling ? 'Programar taxi' : 'Solicitar taxi'}
        </Button>
      </div>
    )
  } else if (scheduledTrip) {
    bottomBar = (
      <Button variant="danger" size="lg" icon={XCircle} onClick={() => setCancelOpen(true)} className="w-full">
        Cancelar viaje programado
      </Button>
    )
  } else if (noDriversTrip) {
    bottomBar = (
      <Button variant="brand" size="lg" icon={Search} onClick={giveUpOnNoDrivers} className="w-full">
        Buscar de nuevo
      </Button>
    )
  } else if (activeTrip && ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'].includes(activeTrip.status)) {
    bottomBar = (
      <Button variant="danger" size="lg" icon={XCircle} onClick={() => setCancelOpen(true)} className="w-full">
        Cancelar viaje
      </Button>
    )
  } else if (finishedTrip) {
    bottomBar = (
      <Button variant="brand" size="lg" onClick={handleNewTrip} className="w-full">
        Solicitar otro viaje
      </Button>
    )
  }

  return (
    <Layout
      title="Solicitar taxi"
      subtitle="Pide tu viaje en segundos"
      bottomBar={bottomBar}
      sidebar={
        !activeTrip && !finishedTrip && !scheduledTrip && !noDriversTrip ? (
          <ProfileSidebar profile={profile} totalTrips={stats?.totalTrips} onOpenRatings={openRatings} onOpenHistory={openHistory} />
        ) : null
      }
    >
      <ConfirmDialogElement />
      <RatingsModal open={ratingsOpen} onClose={() => setRatingsOpen(false)} ratings={ratings} loading={ratingsLoading} title="Tus calificaciones" />
      <CancelTripModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancelTrip} busy={cancelBusy} />
      <DetailListModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Tus viajes"
        loading={historyLoading}
        items={tripHistory}
        renderItem={(t) => <TripHistoryRow trip={t} />}
        emptyMessage="Aún no has solicitado ningún viaje."
      />
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSend={sendChatMessage}
        sending={chatSending}
        currentUserId={user.id}
        title={activeTrip?.driverName ? `Chat con ${activeTrip.driverName}` : 'Chat'}
        quickReplies={['Ya voy saliendo', 'Estoy en el punto de origen', 'Un momento por favor', '¿Cuánto tardas?', 'Gracias']}
      />
      <div className="space-y-5">
        {!activeTrip && !finishedTrip && !scheduledTrip && !noDriversTrip && showWelcome && (
          <div className="relative animate-fade-in-up rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-ink-800">
            <button onClick={() => setShowWelcome(false)} className="absolute right-3 top-3 text-ink-400 hover:text-ink-600">
              <X className="h-4 w-4" />
            </button>
            <p className="pr-6 text-sm font-semibold">¡Bienvenido, {profile?.name?.split(' ')[0] || ''}! 👋</p>
            <p className="mt-1 text-xs text-ink-600">Elige tu destino, confirma tu tarifa y disfruta tu viaje. Si algo cambia, puedes cancelar antes o durante el viaje.</p>
          </div>
        )}

        {geoError && (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {geoError}
          </div>
        )}

        {!activeTrip && !finishedTrip && !scheduledTrip && !noDriversTrip && (
          <>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPickingField('origin')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-semibold transition ${
                  pickingField === 'origin' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-500 hover:border-ink-200'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" /> ¿Dónde tomarás el taxi?
              </button>
              <button
                type="button"
                onClick={() => setPickingField('destination')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-semibold transition ${
                  pickingField === 'destination' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-500 hover:border-ink-200'
                }`}
              >
                <Flag className="h-3.5 w-3.5" /> Elegir destino en el mapa
              </button>
            </div>

            <MapView
              origin={origin}
              destination={destination}
              availableDrivers={nearby}
              routeGeometry={preview?.routeGeometry}
              onMapClick={handleMapClick}
              pickingLabel={pickingField === 'origin' ? 'Toca el mapa para elegir dónde te recogemos' : 'Toca el mapa para elegir tu destino'}
              height={MAP_HEIGHT}
              myLocation={gpsOrigin}
            />

            <Card>
              <CardHeader icon={Navigation} title="¿A dónde vamos?" subtitle="Confirma origen, destino y cómo pagarás" />

              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label className="block text-xs font-semibold text-ink-600">Te recogemos en</label>
                    {manualOrigin && (
                      <button type="button" onClick={handleUseCurrentLocation} className="text-[11px] font-medium text-ink-500 hover:text-ink-900 hover:underline">
                        Usar mi ubicación actual
                      </button>
                    )}
                  </div>
                  <Input icon={MapPin} value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="Esperando tu ubicación..." />
                </div>
                <div>
                  <Label hint="escribe o toca el mapa">A dónde quieres ir</Label>
                  <div className="relative">
                    <Input
                      icon={Flag}
                      value={destinationQuery || destinationAddress}
                      onChange={(e) => {
                        setDestinationAddress(e.target.value)
                        handleSearchDestination(e.target.value)
                      }}
                      placeholder="Escribe una dirección..."
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400" />}
                  </div>
                  {searchError && <p className="mt-1 text-[11px] text-red-600">{searchError}</p>}
                </div>
                <div>
                  <Label>Método de pago</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'CASH', label: 'Efectivo', icon: Banknote },
                      { value: 'TRANSFER', label: 'Transferencia', icon: CreditCard },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                          paymentMethod === value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-500 hover:border-ink-200'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>¿Cuándo?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScheduling(false)}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                        !isScheduling ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-500 hover:border-ink-200'
                      }`}
                    >
                      <Navigation className="h-4 w-4" /> Ahora
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduling(true)}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                        isScheduling ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-500 hover:border-ink-200'
                      }`}
                    >
                      <CalendarClock className="h-4 w-4" /> Programar
                    </button>
                  </div>
                  {isScheduling && (
                    <Input
                      type="datetime-local"
                      className="mt-2"
                      value={scheduledAt}
                      min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTripOptionsOpen(true)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 py-2.5 text-sm font-semibold text-ink-600 transition hover:border-brand-400 hover:text-ink-900"
                >
                  <Sparkles className="h-4 w-4" />
                  Crear oferta
                  {tripOptionsCount > 0 && <Badge tone="brand">{tripOptionsCount}</Badge>}
                </button>
              </div>
            </Card>
          </>
        )}

        <Modal open={tripOptionsOpen} onClose={() => setTripOptionsOpen(false)} title="Opciones">
          <div className="divide-y divide-ink-100">
            <Switch
              label="Silla de bebé"
              checked={tripOptions.babySeat}
              onChange={(v) => setTripOptions((o) => ({ ...o, babySeat: v }))}
            />
            <Switch
              label="Más de 4 pasajeros"
              checked={tripOptions.moreThanFourPassengers}
              onChange={(v) => setTripOptions((o) => ({ ...o, moreThanFourPassengers: v }))}
            />
            <Switch label="Llevo una mascota" checked={tripOptions.hasPet} onChange={(v) => setTripOptions((o) => ({ ...o, hasPet: v }))} />
          </div>
          <Textarea
            className="mt-3"
            placeholder="Comentarios"
            rows={2}
            maxLength={300}
            value={tripOptions.comments}
            onChange={(e) => setTripOptions((o) => ({ ...o, comments: e.target.value }))}
          />
          <Button variant="primary" className="mt-4 w-full" onClick={() => setTripOptionsOpen(false)}>
            Cerrar
          </Button>
        </Modal>

        {scheduledTrip && (
          <Card className="animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">Viaje programado</p>
                <p className="text-xs text-ink-500">
                  {new Date(scheduledTrip.scheduledAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm text-ink-700">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-600" /> {scheduledTrip.originAddress}
              </p>
              <p className="flex items-center gap-2">
                <Flag className="h-4 w-4 shrink-0 text-red-500" /> {scheduledTrip.destinationAddress}
              </p>
            </div>
            <p className="mt-3 text-xs text-ink-400">
              Buscaremos un operador automáticamente unos minutos antes de la hora programada.
            </p>
          </Card>
        )}

        {noDriversTrip && (
          <EmptyState
            icon={AlertCircle}
            title="No hay operadores disponibles cerca"
            description="Estamos ampliando la búsqueda automáticamente. Si encontramos un operador, el viaje continúa solo; si no, volveremos al inicio en unos segundos."
          />
        )}

        {activeTrip && (
          <>
            <MapView
              origin={origin}
              destination={destination}
              driver={mapDriver}
              routeGeometry={activeTrip.routeGeometry}
              height={MAP_HEIGHT}
              myLocation={gpsOrigin}
            />

            <Card>
              <div className="mb-4">
                <TripStatusStepper status={activeTrip.status} />
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 pt-4">
                <Badge tone={STATUS_COPY[activeTrip.status]?.tone}>{STATUS_COPY[activeTrip.status]?.label}</Badge>
                <span className="text-sm font-bold text-ink-900">${activeTrip.estimatedFare} MXN</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {activeTrip.distanceKm} km &middot; ~{Math.round(activeTrip.durationMin)} min &middot;{' '}
                {activeTrip.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
              </p>

              <button
                type="button"
                onClick={handleShareTrip}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
              >
                <Share2 className="h-3.5 w-3.5" />
                {shareCopied ? 'Enlace copiado' : 'Compartir viaje'}
              </button>

              {activeTrip.driverName && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  {activeTrip.driverPhotoUrl ? (
                    <img src={`${API_URL}${activeTrip.driverPhotoUrl}`} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                      {activeTrip.driverName.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{activeTrip.driverName}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {activeTrip.driverRating} &middot; Taxi{' '}
                      {activeTrip.taxiUnitNumber} ({activeTrip.taxiPlates})
                      {(activeTrip.taxiBrand || activeTrip.taxiModel) &&
                        ` · ${[activeTrip.taxiBrand, activeTrip.taxiModel].filter(Boolean).join(' ')}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {activeTrip.driverPhone && (
                      <a
                        href={`tel:${activeTrip.driverPhone}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:bg-ink-100"
                        aria-label="Llamar al operador"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {chatEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setChatOpen(true)
                          markAllRead()
                        }}
                        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:bg-ink-100"
                        aria-label="Chatear con el operador"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {chatUnread > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                            {chatUnread}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {activeTrip.driverName && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Antes de subir, verifica que coincidan el <strong>nombre</strong>, la <strong>foto</strong> del operador y el{' '}
                    <strong>número de unidad</strong>/<strong>placas</strong> del taxi con lo que se muestra aquí.
                  </span>
                </div>
              )}
            </Card>
          </>
        )}

        {finishedTrip && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <Badge tone={STATUS_COPY[finishedTrip.status]?.tone}>{STATUS_COPY[finishedTrip.status]?.label}</Badge>
                {finishedTrip.status === 'COMPLETED' && <span className="text-lg font-bold text-ink-900">${finishedTrip.estimatedFare} MXN</span>}
              </div>
            </Card>
            {finishedTrip.status === 'COMPLETED' && !rated && finishedTrip.driverName && (
              <RatingForm
                tripId={finishedTrip.id}
                targetLabel={finishedTrip.driverName}
                showTip
                onDone={(tip) => {
                  setRated(true)
                  setTipGiven(tip)
                }}
              />
            )}
            {finishedTrip.status === 'COMPLETED' && rated && (
              <EmptyState
                icon={Star}
                title="¡Gracias por calificar!"
                description={tipGiven > 0 ? `También enviaste una propina de $${tipGiven} MXN. ¡Gracias!` : 'Tu opinión ayuda a mejorar el servicio.'}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
