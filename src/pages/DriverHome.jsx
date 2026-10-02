import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Power,
  MapPin,
  Flag,
  Banknote,
  CreditCard,
  Navigation,
  CheckCircle2,
  XCircle,
  User,
  AlertCircle,
  Star,
  Car,
  ListChecks,
  Wallet,
  ThumbsUp,
  UserX,
  Gift,
  Home,
  Phone,
  X,
  MessageCircle,
  Baby,
  Users,
  PawPrint,
  AlertTriangle,
} from 'lucide-react'
import Layout from '../components/Layout'
import MapView from '../components/map/MapView'
import RatingForm from '../components/RatingForm'
import RatingsModal from '../components/RatingsModal'
import CancelTripModal from '../components/CancelTripModal'
import ChatPanel from '../components/ChatPanel'
import DetailListModal from '../components/DetailListModal'
import TripHistoryRow from '../components/TripHistoryRow'
import TripStatusStepper from '../components/TripStatusStepper'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import PageLoader from '../components/ui/PageLoader'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import { Label, Input, Textarea } from '../components/ui/Field'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { useSubscription } from '../hooks/useSubscription'
import { useTripChat } from '../hooks/useTripChat'
import * as driverApi from '../api/driver'
import { cancelTrip } from '../api/trips'

const STATUS_COPY = {
  ACCEPTED: { label: 'Dirígete al origen', tone: 'success' },
  IN_PROGRESS: { label: 'Viaje en curso', tone: 'info' },
  COMPLETED: { label: 'Viaje finalizado', tone: 'success' },
  CANCELLED: { label: 'Viaje cancelado', tone: 'danger' },
}

const MAP_HEIGHT = 'clamp(240px, 42dvh, 420px)'
const API_URL = import.meta.env.VITE_API_URL || ''

function ProfileSidebar({ profile, currentTaxi, onOpenRatings, onOpenTaxiChange }) {
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
        {profile.address && (
          <p className="flex items-center gap-2">
            <Home className="h-3.5 w-3.5 shrink-0 text-ink-400" /> {profile.address}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Car className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          {currentTaxi ? `Unidad ${currentTaxi.unitNumber} · ${currentTaxi.plates}` : 'Sin taxi asignado'}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenTaxiChange}
        className="mt-3 w-full rounded-xl border border-ink-200 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50"
      >
        Solicitar cambio de taxi
      </button>
    </Card>
  )
}

export default function DriverHome() {
  const { user } = useAuth()
  const location = useLocation()
  const [online, setOnline] = useState(false)
  const { position, error: geoError } = useGeolocation(online)
  const [trip, setTrip] = useState(undefined)
  const [offers, setOffers] = useState([])
  const [busyOfferId, setBusyOfferId] = useState(null)
  const [rated, setRated] = useState(false)
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [currentTaxi, setCurrentTaxi] = useState(undefined) // undefined = cargando, null = sin taxi asignado
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ratingsOpen, setRatingsOpen] = useState(false)
  const [ratings, setRatings] = useState(null)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [showWelcome, setShowWelcome] = useState(Boolean(location.state?.justLoggedIn))
  const [tripHistory, setTripHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyModal, setHistoryModal] = useState(null)
  const [taxiChangeOpen, setTaxiChangeOpen] = useState(false)
  const [taxiChangeForm, setTaxiChangeForm] = useState({ unitNumber: '', plates: '', brand: '', model: '', reason: '' })
  const [taxiChangeBusy, setTaxiChangeBusy] = useState(false)
  const [taxiChangeError, setTaxiChangeError] = useState('')
  const [taxiChangeSent, setTaxiChangeSent] = useState(false)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const handleRequestTaxiChange = async (e) => {
    e.preventDefault()
    setTaxiChangeBusy(true)
    setTaxiChangeError('')
    try {
      await driverApi.requestTaxiChange(taxiChangeForm)
      setTaxiChangeSent(true)
    } catch (err) {
      setTaxiChangeError(err.response?.data?.message || 'No se pudo enviar la solicitud')
    } finally {
      setTaxiChangeBusy(false)
    }
  }

  const closeTaxiChangeModal = () => {
    setTaxiChangeOpen(false)
    setTaxiChangeSent(false)
    setTaxiChangeForm({ unitNumber: '', plates: '', brand: '', model: '', reason: '' })
  }

  const loadStats = () => driverApi.driverStats().then(({ data }) => setStats(data.data)).catch(() => {})

  const openRatings = () => {
    setRatingsOpen(true)
    setRatingsLoading(true)
    driverApi.myRatings().then(({ data }) => setRatings(data.data)).finally(() => setRatingsLoading(false))
  }

  const isToday = (dateStr) => Boolean(dateStr) && new Date(dateStr).toDateString() === new Date().toDateString()

  const openStatModal = (title, filterFn) => {
    setHistoryModal({ title, filterFn })
    if (!tripHistory) {
      setHistoryLoading(true)
      driverApi.myTripHistory().then(({ data }) => setTripHistory(data.data)).finally(() => setHistoryLoading(false))
    }
  }

  const handleCancelTrip = async (reason) => {
    setCancelBusy(true)
    try {
      const { data } = await cancelTrip(trip.id, reason || 'Cancelado por el operador')
      setTrip(data.data)
      setCancelOpen(false)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cancelar el viaje')
    } finally {
      setCancelBusy(false)
    }
  }

  useEffect(() => {
    driverApi
      .myActiveTripAsDriver()
      .then(({ data }) => setTrip(data.data))
      .catch(() => setTrip(null))
    loadStats()
    const loadProfile = () => driverApi.myProfile().then(({ data }) => setProfile(data.data)).catch(() => {})
    loadProfile()
    // El pasajero puede calificar (y dejar propina) en cualquier momento despues de que el
    // operador ya vio sus estadisticas del dia - sin este polling, "Propinas hoy"/"Viajes hoy" y su
    // calificacion se quedarian desactualizados hasta cerrar sesion y volver a entrar.
    const statsInterval = setInterval(() => {
      loadStats()
      loadProfile()
    }, 15000)
    return () => clearInterval(statsInterval)
  }, [])

  useEffect(() => {
    const loadCurrentShift = () =>
      driverApi
        .myTaxi()
        .then(({ data }) => setCurrentTaxi(data.data))
        .catch(() => setCurrentTaxi(null))
    loadCurrentShift()
    // El admin puede asignarle (o quitarle) un taxi mientras el operador ya tiene la app
    // abierta (ver Operadores > Taxi) - sin este polling, el operador se quedaria
    // viendo su unidad anterior hasta cerrar sesion y volver a entrar.
    const interval = setInterval(loadCurrentShift, 15000)
    return () => clearInterval(interval)
  }, [])

  // useGeolocation ya limita cuantas veces por segundo reporta una posicion nueva
  // (VITE_LOCATION_UPDATE_MS), asi que aqui no hace falta throttle adicional: cada posicion que
  // llega ya respeta ese intervalo. Si el operador no esta en linea, no se envia nada.
  useEffect(() => {
    if (!online || !position) return
    driverApi.pingLocation({ lat: position.lat, lng: position.lng, heading: position.heading }).catch(() => {})
  }, [online, position])

  const handleToggleOnline = async () => {
    if (online) {
      await driverApi.goOffline()
      setOnline(false)
    } else {
      setOnline(true)
    }
  }

  useSubscription(
    user?.driverId ? `/topic/driver/${user.driverId}/offers` : null,
    (payload) => {
      if (payload.closed) {
        setOffers((current) => current.filter((o) => o.offerId !== payload.offerId))
        return
      }
      setOffers((current) => (current.some((o) => o.offerId === payload.offerId) ? current : [...current, payload]))
    },
    Boolean(user?.driverId) && online && !trip
  )

  useSubscription(trip ? `/topic/trip/${trip.id}` : null, (updated) => setTrip(updated), Boolean(trip?.id))

  const chatEnabled = Boolean(trip && ['ACCEPTED', 'IN_PROGRESS'].includes(trip.status))
  const { messages: chatMessages, sendMessage: sendChatMessage, sending: chatSending, unreadCount: chatUnread, markAllRead } = useTripChat(
    trip?.id,
    chatEnabled,
    user.id,
    chatOpen
  )

  useEffect(() => {
    if (trip && ['COMPLETED', 'CANCELLED'].includes(trip.status)) loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.status])

  // Puede haber mas de una solicitud pendiente a la vez: el operador elige cual tomar. Al aceptar
  // una, las demas se cierran solas (el backend avisa por WS y las quita de la lista).
  const handleAcceptOffer = async (offer) => {
    const ok = await confirm({
      title: offer.wasScheduled ? '¿Aceptar este viaje programado?' : '¿Aceptar este viaje?',
      message: offer.wasScheduled
        ? 'Este viaje se programó con anticipación. Al aceptarlo te comprometes a realizarlo.'
        : 'Al aceptarlo te comprometes a realizar este viaje.',
      confirmLabel: 'Sí, aceptar',
    })
    if (!ok) return

    setBusyOfferId(offer.offerId)
    setError('')
    try {
      const { data } = await driverApi.acceptOffer(offer.tripId, offer.offerId)
      setTrip(data.data)
      setOffers([])
      setRated(false)
      loadStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Ya no se pudo tomar este viaje')
      setOffers((current) => current.filter((o) => o.offerId !== offer.offerId))
    } finally {
      setBusyOfferId(null)
    }
  }

  const handleRejectOffer = async (offer) => {
    setOffers((current) => current.filter((o) => o.offerId !== offer.offerId))
    await driverApi.rejectOffer(offer.tripId, offer.offerId).catch(() => {})
  }

  const handleStart = async () => {
    const { data } = await driverApi.startTrip(trip.id)
    setTrip(data.data)
  }

  const handleComplete = async () => {
    const { data } = await driverApi.completeTrip(trip.id)
    setTrip(data.data)
  }

  const handleConfirmPayment = async () => {
    await driverApi.confirmPayment(trip.id)
    setTrip((t) => ({ ...t, paymentConfirmed: true }))
  }

  const handleFinishTripView = () => {
    setTrip(null)
    setRated(false)
  }

  if (trip === undefined) {
    return (
      <Layout title="Panel del operador">
        <PageLoader />
      </Layout>
    )
  }

  const activeTrip = trip && !['COMPLETED', 'CANCELLED'].includes(trip.status) ? trip : null
  const finishedTrip = trip && ['COMPLETED', 'CANCELLED'].includes(trip.status) ? trip : null

  let bottomBar = null
  if (!activeTrip && !finishedTrip && offers.length === 0) {
    bottomBar = (
      <Button
        variant={online ? 'danger' : 'success'}
        size="lg"
        icon={Power}
        onClick={handleToggleOnline}
        disabled={!online && !currentTaxi}
        className="w-full"
      >
        {online ? 'Desconectarme' : 'Conectarme'}
      </Button>
    )
  } else if (activeTrip?.status === 'ACCEPTED') {
    bottomBar = (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" size="lg" icon={XCircle} onClick={() => setCancelOpen(true)}>
          Cancelar
        </Button>
        <Button variant="brand" size="lg" icon={Navigation} onClick={handleStart}>
          Iniciar viaje
        </Button>
      </div>
    )
  } else if (activeTrip?.status === 'IN_PROGRESS') {
    bottomBar = (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" size="lg" icon={XCircle} onClick={() => setCancelOpen(true)}>
          Cancelar
        </Button>
        <Button variant="success" size="lg" icon={CheckCircle2} onClick={handleComplete}>
          Finalizar viaje
        </Button>
      </div>
    )
  } else if (finishedTrip) {
    bottomBar = (
      <Button variant="brand" size="lg" onClick={handleFinishTripView} className="w-full">
        Volver a estar disponible
      </Button>
    )
  }

  return (
    <Layout
      title="Panel del operador"
      subtitle="Gestiona tu disponibilidad y viajes"
      bottomBar={bottomBar}
      sidebar={
        !activeTrip && !finishedTrip ? (
          <ProfileSidebar profile={profile} currentTaxi={currentTaxi} onOpenRatings={openRatings} onOpenTaxiChange={() => setTaxiChangeOpen(true)} />
        ) : null
      }
    >
      <ConfirmDialogElement />
      <RatingsModal open={ratingsOpen} onClose={() => setRatingsOpen(false)} ratings={ratings} loading={ratingsLoading} title="Tus calificaciones" />
      <CancelTripModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancelTrip} busy={cancelBusy} />
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSend={sendChatMessage}
        sending={chatSending}
        currentUserId={user.id}
        title={activeTrip?.passengerName ? `Chat con ${activeTrip.passengerName}` : 'Chat'}
        quickReplies={['Voy en camino', 'Llegué al punto de origen', 'Estoy afuera', 'Un momento por favor', 'Gracias']}
      />
      <DetailListModal
        open={Boolean(historyModal)}
        onClose={() => setHistoryModal(null)}
        title={historyModal?.title}
        loading={historyLoading}
        items={historyModal && tripHistory ? tripHistory.filter(historyModal.filterFn) : null}
        renderItem={(t) => <TripHistoryRow trip={t} />}
        emptyMessage="No hay viajes que coincidan con esto todavía."
      />
      <Modal open={taxiChangeOpen} onClose={closeTaxiChangeModal} title="Solicitar cambio de taxi">
        {taxiChangeSent ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink-700">Tu solicitud fue enviada. Un administrador la revisará y te avisaremos por correo en cuanto se resuelva.</p>
            <Button variant="brand" className="w-full" onClick={closeTaxiChangeModal}>
              Entendido
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRequestTaxiChange} className="space-y-3">
            <p className="text-xs text-ink-500">
              Un administrador debe aprobar este cambio antes de que quede vinculado a tu cuenta.
            </p>
            <div>
              <Label>Número de unidad</Label>
              <Input required value={taxiChangeForm.unitNumber} onChange={(e) => setTaxiChangeForm((f) => ({ ...f, unitNumber: e.target.value }))} />
            </div>
            <div>
              <Label>Placas</Label>
              <Input required value={taxiChangeForm.plates} onChange={(e) => setTaxiChangeForm((f) => ({ ...f, plates: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label hint="opcional">Marca</Label>
                <Input value={taxiChangeForm.brand} onChange={(e) => setTaxiChangeForm((f) => ({ ...f, brand: e.target.value }))} />
              </div>
              <div>
                <Label hint="opcional">Modelo</Label>
                <Input value={taxiChangeForm.model} onChange={(e) => setTaxiChangeForm((f) => ({ ...f, model: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label hint="opcional">Motivo</Label>
              <Textarea rows={2} value={taxiChangeForm.reason} onChange={(e) => setTaxiChangeForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            {taxiChangeError && (
              <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">{taxiChangeError}</div>
            )}
            <Button type="submit" variant="brand" className="w-full" loading={taxiChangeBusy}>
              Enviar solicitud
            </Button>
          </form>
        )}
      </Modal>
      <div className="space-y-5">
        {!activeTrip && !finishedTrip && showWelcome && (
          <div className="relative animate-fade-in-up rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-ink-800">
            <button onClick={() => setShowWelcome(false)} className="absolute right-3 top-3 text-ink-400 hover:text-ink-600">
              <X className="h-4 w-4" />
            </button>
            <p className="pr-6 text-sm font-semibold">¡Bienvenido de vuelta, {user.name.split(' ')[0]}! 👋</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-ink-600">
              <li>Sé amable y cortés con tus pasajeros durante todo el viaje.</li>
              <li>Nunca manejes bajo el efecto del alcohol u otras sustancias.</li>
              <li>Respeta los límites de velocidad y maneja con precaución.</li>
              <li>Confirma el destino con el pasajero antes de iniciar el viaje.</li>
            </ul>
          </div>
        )}

        {!activeTrip && !finishedTrip && (
          <Card className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                online ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-400'
              }`}
            >
              <Power className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{online ? 'En línea' : 'Fuera de línea'}</p>
              <p className="text-xs text-ink-500">
                {currentTaxi
                  ? `Unidad ${currentTaxi.unitNumber} · ${currentTaxi.plates}`
                  : online
                    ? 'Recibirás solicitudes cercanas'
                    : 'Conéctate para recibir viajes'}
              </p>
            </div>
          </Card>
        )}

        {!activeTrip && !finishedTrip && stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={ListChecks}
              label="Viajes hoy"
              value={stats.tripsCompletedToday}
              tone="brand"
              onClick={() => openStatModal('Viajes completados hoy', (t) => t.status === 'COMPLETED' && isToday(t.completedAt))}
            />
            <StatCard
              icon={Wallet}
              label="Ganado hoy"
              value={`$${stats.earningsToday}`}
              tone="success"
              onClick={() => openStatModal('Viajes completados hoy', (t) => t.status === 'COMPLETED' && isToday(t.completedAt))}
            />
            <StatCard
              icon={ThumbsUp}
              label="Aceptados hoy"
              value={stats.tripsAcceptedToday}
              onClick={() => openStatModal('Viajes aceptados hoy', (t) => isToday(t.acceptedAt))}
            />
            <StatCard
              icon={UserX}
              label="Cancelados por pasajero"
              value={stats.tripsCancelledByPassengerToday}
              onClick={() =>
                openStatModal('Cancelados por el pasajero hoy', (t) => t.status === 'CANCELLED' && t.cancelledByRole === 'PASSENGER' && isToday(t.cancelledAt))
              }
            />
            <StatCard
              icon={Gift}
              label="Propinas hoy"
              value={`$${stats.tipsToday}`}
              tone="success"
              onClick={() => openStatModal('Viajes completados hoy', (t) => t.status === 'COMPLETED' && isToday(t.completedAt))}
            />
          </div>
        )}

        {!activeTrip && !finishedTrip && currentTaxi === null && (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <Car className="mt-0.5 h-4 w-4 shrink-0" />
            Por el momento no tienes un taxi asignado. Pide a tu administrador que te asigne un turno para poder conectarte.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {online && geoError && (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {geoError}
          </div>
        )}

        {!activeTrip && !finishedTrip && offers.length === 0 && online && (
          <EmptyState illustration="waitingForRide" title="Esperando solicitudes..." description="Te avisaremos en cuanto haya un pasajero cerca de ti." />
        )}

        {!activeTrip && !finishedTrip && offers.length > 0 && (
          <div className="space-y-3">
            {offers.length > 1 && (
              <p className="text-xs font-semibold text-ink-600">
                {offers.length} solicitudes disponibles — elige la que prefieras:
              </p>
            )}
            {offers.map((offer) => (
              <Card key={offer.offerId} className="animate-fade-in-up border-2 border-brand-500 bg-brand-50/40">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge tone="brand">Nueva solicitud</Badge>
                    {offer.wasScheduled && <Badge tone="info">Programado</Badge>}
                  </div>
                  <span className="text-sm font-bold text-ink-900">${offer.estimatedFare} MXN</span>
                </div>
                <div className="space-y-1.5 text-sm text-ink-700">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-600" /> {offer.originAddress}
                  </p>
                  <p className="flex items-center gap-2">
                    <Flag className="h-4 w-4 shrink-0 text-red-500" /> {offer.destinationAddress}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                  <span>{offer.distanceKm} km</span>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1">
                    {offer.paymentMethod === 'CASH' ? <Banknote className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                    {offer.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
                  </span>
                  <span>&middot;</span>
                  <span>a {offer.driverDistanceKm} km de ti</span>
                </div>
                {(offer.babySeat || offer.moreThanFourPassengers || offer.hasPet || offer.comments) && (
                  <div className="mt-3 space-y-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                    {offer.babySeat && (
                      <p className="flex items-center gap-1.5">
                        <Baby className="h-3.5 w-3.5 shrink-0" /> Silla de bebé
                      </p>
                    )}
                    {offer.moreThanFourPassengers && (
                      <p className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 shrink-0" /> Más de 4 pasajeros
                      </p>
                    )}
                    {offer.hasPet && (
                      <p className="flex items-center gap-1.5">
                        <PawPrint className="h-3.5 w-3.5 shrink-0" /> Lleva una mascota
                      </p>
                    )}
                    {offer.comments && (
                      <p className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {offer.comments}
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    icon={XCircle}
                    disabled={busyOfferId !== null}
                    onClick={() => handleRejectOffer(offer)}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="brand"
                    size="md"
                    icon={CheckCircle2}
                    loading={busyOfferId === offer.offerId}
                    disabled={busyOfferId !== null && busyOfferId !== offer.offerId}
                    onClick={() => handleAcceptOffer(offer)}
                  >
                    Aceptar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTrip && (
          <>
            <MapView
              origin={{ lat: activeTrip.originLat, lng: activeTrip.originLng }}
              destination={{ lat: activeTrip.destinationLat, lng: activeTrip.destinationLng }}
              driver={position ? { lat: position.lat, lng: position.lng } : null}
              routeGeometry={activeTrip.routeGeometry}
              height={MAP_HEIGHT}
              myLocation={position ? { lat: position.lat, lng: position.lng } : null}
            />
            <Card>
              <div className="mb-4">
                <TripStatusStepper status={activeTrip.status} />
              </div>
              <div className="flex items-center justify-between border-t border-ink-100 pt-4">
                <Badge tone={STATUS_COPY[activeTrip.status]?.tone}>{STATUS_COPY[activeTrip.status]?.label}</Badge>
                <span className="text-sm font-bold text-ink-900">${activeTrip.estimatedFare} MXN</span>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                {activeTrip.passengerPhotoUrl ? (
                  <img src={`${API_URL}${activeTrip.passengerPhotoUrl}`} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
                    <User className="h-4.5 w-4.5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{activeTrip.passengerName}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-ink-500">
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" /> {activeTrip.passengerRating ?? '—'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {activeTrip.passengerPhone && (
                    <a
                      href={`tel:${activeTrip.passengerPhone}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:bg-ink-100"
                      aria-label="Llamar al pasajero"
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
                      aria-label="Chatear con el pasajero"
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
              <p className="mt-2 truncate text-xs text-ink-400">{activeTrip.originAddress} → {activeTrip.destinationAddress}</p>
              {(activeTrip.babySeat || activeTrip.moreThanFourPassengers || activeTrip.hasPet || activeTrip.specialComments) && (
                <div className="mt-3 space-y-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  {activeTrip.babySeat && (
                    <p className="flex items-center gap-1.5">
                      <Baby className="h-3.5 w-3.5 shrink-0" /> Silla de bebé
                    </p>
                  )}
                  {activeTrip.moreThanFourPassengers && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" /> Más de 4 pasajeros
                    </p>
                  )}
                  {activeTrip.hasPet && (
                    <p className="flex items-center gap-1.5">
                      <PawPrint className="h-3.5 w-3.5 shrink-0" /> Lleva una mascota
                    </p>
                  )}
                  {activeTrip.specialComments && (
                    <p className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {activeTrip.specialComments}
                    </p>
                  )}
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
              {finishedTrip.status === 'COMPLETED' && finishedTrip.paymentMethod === 'TRANSFER' && !finishedTrip.paymentConfirmed && (
                <Button variant="outline" onClick={handleConfirmPayment} className="mt-4 w-full">
                  Confirmar transferencia recibida
                </Button>
              )}
            </Card>
            {finishedTrip.status === 'COMPLETED' && !rated && (
              <RatingForm
                tripId={finishedTrip.id}
                targetLabel={finishedTrip.passengerName}
                onDone={() => {
                  setRated(true)
                  // Tras calificar, regresa solo a estar disponible (sigue conectado) sin que el
                  // operador tenga que tocar nada mas.
                  setTimeout(() => {
                    setTrip(null)
                    setRated(false)
                  }, 1400)
                }}
              />
            )}
            {finishedTrip.status === 'COMPLETED' && rated && (
              <EmptyState icon={Star} title="¡Gracias por calificar!" description="Sigue así, tu reputación atrae más viajes." />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
