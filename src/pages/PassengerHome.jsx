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
  Camera,
  AlertTriangle,
  UserX,
  Home,
  Briefcase,
  Bookmark,
  Plus,
  Trash2,
  KeyRound,
  Siren,
  HelpCircle,
  Pencil,
  Users,
  ChevronDown,
} from 'lucide-react'
import * as passengerApi from '../api/passenger'
import Layout from '../components/Layout'
import MapView from '../components/map/MapView'
import RatingForm from '../components/RatingForm'
import RatingsModal from '../components/RatingsModal'
import CancelTripModal from '../components/CancelTripModal'
import ReportTripModal from '../components/ReportTripModal'
import ChatPanel from '../components/ChatPanel'
import { useConfirm } from '../components/ui/ConfirmDialog'
import DetailListModal from '../components/DetailListModal'
import TripHistoryRow from '../components/TripHistoryRow'
import TripStatusStepper from '../components/TripStatusStepper'
import ReferralCard from '../components/ReferralCard'
import Card, { CardHeader } from '../components/ui/Card'
import AddressAutocomplete from '../components/ui/AddressAutocomplete'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import Switch from '../components/ui/Switch'
import { Label, Input, Textarea } from '../components/ui/Field'
import PageLoader from '../components/ui/PageLoader'
import EmptyState from '../components/ui/EmptyState'
import { useGeolocation } from '../hooks/useGeolocation'
import { useSubscription } from '../hooks/useSubscription'
import { useTripChat } from '../hooks/useTripChat'
import { useInactivityLogout } from '../hooks/useInactivityLogout'
import { useBrowserNotifications } from '../hooks/useBrowserNotifications'
import NotificationPermissionBanner from '../components/NotificationPermissionBanner'
import { useAuth } from '../context/AuthContext'
import { updateLastLocation } from '../api/auth'
import {
  myActiveTripAsPassenger,
  myPassengerStats,
  myTripHistory,
  requestTrip,
  cancelTrip,
  nearbyDrivers,
  reportTrip,
  getVerificationCode,
  updateTripOrigin,
  updateTripDestination,
} from '../api/trips'
import { reverseGeocode } from '../services/geocodingService'
import { estimateRoute } from '../services/routingService'
import { NEARBY_DRIVERS_POLL_MS, DEFAULT_MAP_CENTER } from '../config'

// Distancia en linea recta entre dos puntos (km) - usada solo para estimar cuanto falta para que
// el operador llegue al punto de recogida, sin depender de un servicio de rutas de pago.
function haversineKm(a, b) {
  if (!a || !b) return null
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Velocidad promedio urbana usada solo para esta estimacion - no hay forma gratuita de pedir una
// ETA real sin golpear el servidor publico de OSRM en cada ping de ubicacion del operador (llega
// cada pocos segundos), asi que se calcula en el navegador a partir de la distancia en linea recta.
const AVG_SPEED_KMH = 25

const HELP_FAQS = [
  { q: '¿Cómo pago mi viaje?', a: 'En efectivo o por transferencia al operador, según lo que elijas al pedirlo. El total se muestra antes de confirmar.' },
  { q: '¿Qué es el PIN del viaje?', a: 'Es el código que debes decirle al operador al subir, para confirmar que el taxi que llegó es el tuyo.' },
  { q: '¿Cómo cancelo un viaje?', a: 'Usa el botón "Cancelar viaje" en la pantalla de tu viaje activo.' },
  { q: '¿Cómo reporto un problema?', a: 'Usa el botón "Reportar un problema" dentro del viaje; un administrador lo revisará.' },
  { q: '¿Cómo comparto mi viaje?', a: 'Usa el botón "Compartir viaje"; genera un enlace para que alguien más siga tu viaje en tiempo real.' },
  { q: '¿Qué hago en una emergencia?', a: 'Usa el botón "Llamar al 911" dentro del viaje.' },
]

const STATUS_COPY = {
  SEARCHING: { label: 'Buscando un taxi cercano...', tone: 'brand' },
  ACCEPTED: { label: 'Un operador aceptó tu viaje', tone: 'success' },
  IN_PROGRESS: { label: 'Viaje en curso', tone: 'info' },
  COMPLETED: { label: 'Viaje finalizado', tone: 'success' },
  CANCELLED: { label: 'Viaje cancelado', tone: 'danger' },
  NO_DRIVERS_AVAILABLE: { label: 'No hay operadores disponibles cerca', tone: 'warning' },
}

const MAP_HEIGHT = 'clamp(240px, 42dvh, 420px)'

// La tarifa que paga el pasajero incluye el cobro de servicio de la plataforma (ver
// PlatformSettingsService/DriverBillingService) ademas de la tarifa del viaje.
const totalToPay = (fare, fee) => (Number(fare || 0) + Number(fee || 0)).toFixed(2)
const API_URL = import.meta.env.VITE_API_URL || ''

function ProfileSidebar({ profile, totalTrips, onOpenRatings, onOpenHistory, onUploadPhoto, uploadingPhoto, photoError, onRequestDeletion, onOpenContacts }) {
  const fileInputRef = useRef(null)
  if (!profile) return null
  return (
    <Card className="text-center lg:text-left">
      <div className="flex flex-col items-center gap-3 lg:items-start">
        <div className="relative">
          {profile.photoUrl ? (
            <img src={`${API_URL}${profile.photoUrl}`} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-900 text-2xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            aria-label="Cambiar foto de perfil"
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-white shadow-sm hover:bg-ink-700 disabled:opacity-60"
          >
            {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUploadPhoto(file)
              e.target.value = ''
            }}
          />
        </div>
        {photoError && <p className="text-[11px] text-red-600">{photoError}</p>}
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
      <button
        type="button"
        onClick={onOpenContacts}
        className="mt-3 w-full rounded-xl border border-ink-200 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50"
      >
        Contactos de confianza
      </button>
      <button
        type="button"
        onClick={onRequestDeletion}
        className="mt-2 w-full rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Eliminar mi cuenta
      </button>
    </Card>
  )
}

export default function PassengerHome() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { position, error: geoError } = useGeolocation(true)
  const { permission: notifPermission, requestPermission: requestNotifPermission, notify } = useBrowserNotifications()
  const [trip, setTrip] = useState(undefined) // undefined = cargando, null = sin viaje
  const [destination, setDestination] = useState(null)
  const [originAddress, setOriginAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')
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
  const [tripOptions, setTripOptions] = useState({
    babySeat: false,
    moreThanFourPassengers: false,
    hasPet: false,
    requiresWheelchairAccessible: false,
    comments: '',
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [historyModal, setHistoryModal] = useState(null)
  const [tripHistory, setTripHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [tipGiven, setTipGiven] = useState(0)
  const [savedPlaces, setSavedPlaces] = useState([])
  const [addPlaceOpen, setAddPlaceOpen] = useState(false)
  const [newPlaceLabel, setNewPlaceLabel] = useState('')
  const [savingPlace, setSavingPlace] = useState(false)
  const [savedPlaceError, setSavedPlaceError] = useState('')
  const [verificationCode, setVerificationCode] = useState(null)
  const [trustedContacts, setTrustedContacts] = useState([])
  const [contactsOpen, setContactsOpen] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [contactsError, setContactsError] = useState('')
  const [savingContact, setSavingContact] = useState(false)
  const [editingStop, setEditingStop] = useState(null) // 'origin' | 'destination' | null
  const [editQuery, setEditQuery] = useState('')
  const [editSearching, setEditSearching] = useState(false)
  const [editError, setEditError] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpFaqOpen, setHelpFaqOpen] = useState(null)
  const geocodedOriginRef = useRef(false)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const loadStats = () => myPassengerStats().then(({ data }) => setStats(data.data)).catch(() => {})

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const handleUploadPhoto = async (file) => {
    setUploadingPhoto(true)
    setPhotoError('')
    try {
      const { data } = await passengerApi.uploadPhoto(file)
      setProfile((p) => (p ? { ...p, photoUrl: data.data } : p))
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'No se pudo subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRequestAccountDeletion = async () => {
    const ok = await confirm({
      title: 'Eliminar mi cuenta',
      message:
        'Tu acceso se bloqueará de inmediato y quedará en revisión para que el administrador apruebe el borrado definitivo de tus datos. Esta acción no se puede deshacer una vez aprobada. ¿Continuar?',
      danger: true,
      confirmLabel: 'Eliminar mi cuenta',
    })
    if (!ok) return
    try {
      await passengerApi.requestAccountDeletion()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo solicitar la eliminación')
      return
    }
    await logout()
  }

  const openRatings = () => {
    setRatingsOpen(true)
    setRatingsLoading(true)
    passengerApi.myRatings().then(({ data }) => setRatings(data.data)).finally(() => setRatingsLoading(false))
  }

  const isToday = (dateStr) => Boolean(dateStr) && new Date(dateStr).toDateString() === new Date().toDateString()

  const openStatModal = (title, filterFn) => {
    setHistoryModal({ title, filterFn })
    if (!tripHistory) {
      setHistoryLoading(true)
      myTripHistory().then(({ data }) => setTripHistory(data.data)).finally(() => setHistoryLoading(false))
    }
  }

  const openHistory = () => openStatModal('Tus viajes', () => true)

  const loadSavedPlaces = () => passengerApi.listSavedPlaces().then(({ data }) => setSavedPlaces(data.data)).catch(() => {})
  const loadTrustedContacts = () => passengerApi.listTrustedContacts().then(({ data }) => setTrustedContacts(data.data)).catch(() => {})

  useEffect(() => {
    myActiveTripAsPassenger()
      .then(({ data }) => setTrip(data.data))
      .catch(() => setTrip(null))
    loadStats()
    loadSavedPlaces()
    loadTrustedContacts()
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
  // Mientras el GPS en vivo todavia no responde, el mapa abre cerca de donde esta cuenta se conecto
  // la ultima vez (ver User.lastKnownLat/Lng) en vez de siempre en el mismo punto fijo - no afecta
  // en nada la ubicacion real una vez que el GPS si responde.
  const defaultCenter =
    user?.lastKnownLat != null && user?.lastKnownLng != null
      ? { lat: user.lastKnownLat, lng: user.lastKnownLng }
      : DEFAULT_MAP_CENTER

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
    // Se guarda para que la proxima vez que inicie sesion el mapa abra cerca de aqui en vez de en
    // el centro fijo por defecto, mientras el GPS en vivo todavia no responde - no afecta en nada
    // a "usar mi ubicacion actual", que sigue siendo el GPS real de este momento.
    updateLastLocation(position.lat, position.lng).catch(() => {})
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
      if (updated.status !== trip?.status && STATUS_COPY[updated.status]) {
        notify('NexoraTaxis', { body: STATUS_COPY[updated.status].label })
      }
      setTrip(updated)
      if (['COMPLETED', 'CANCELLED', 'NO_DRIVERS_AVAILABLE'].includes(updated.status)) setDriverLive(null)
    },
    Boolean(trip?.id)
  )

  // El codigo se pide aparte (no viaje en el DTO del viaje) para que nunca se transmita por el
  // WebSocket compartido con el operador - ver TripController.verificationCode().
  useEffect(() => {
    if (trip?.id && trip.status === 'ACCEPTED') {
      getVerificationCode(trip.id)
        .then(({ data }) => setVerificationCode(data.data))
        .catch(() => {})
    } else {
      setVerificationCode(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, trip?.status])

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

  const selectSavedPlace = (place) => {
    setDestination({ lat: place.lat, lng: place.lng })
    setDestinationAddress(place.address)
    setDestinationQuery('')
  }

  const handleSaveCurrentDestination = async () => {
    if (!destination || !newPlaceLabel.trim()) return
    setSavingPlace(true)
    setSavedPlaceError('')
    try {
      await passengerApi.createSavedPlace({
        label: newPlaceLabel.trim(),
        address: destinationAddress,
        lat: destination.lat,
        lng: destination.lng,
      })
      setNewPlaceLabel('')
      setAddPlaceOpen(false)
      loadSavedPlaces()
    } catch (err) {
      setSavedPlaceError(err.response?.data?.message || 'No se pudo guardar la direccion')
    } finally {
      setSavingPlace(false)
    }
  }

  const handleDeleteSavedPlace = async (place) => {
    const ok = await confirm({
      title: 'Eliminar dirección favorita',
      message: `Se eliminará "${place.label}" de tus direcciones guardadas.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    await passengerApi.deleteSavedPlace(place.id).catch(() => {})
    loadSavedPlaces()
  }

  const savedPlaceIcon = (label) => {
    const normalized = label.trim().toLowerCase()
    if (normalized === 'casa') return Home
    if (normalized === 'trabajo') return Briefcase
    return Bookmark
  }

  const canRequest = origin && destination && originAddress && destinationAddress && !submitting
  const tripOptionsCount = [
    tripOptions.babySeat,
    tripOptions.moreThanFourPassengers,
    tripOptions.hasPet,
    tripOptions.requiresWheelchairAccessible,
  ].filter(Boolean).length

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
        requiresWheelchairAccessible: tripOptions.requiresWheelchairAccessible,
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

  const [reportTripId, setReportTripId] = useState(null)

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

  // Envia el enlace de seguimiento en vivo a un contacto de confianza por WhatsApp (deep link
  // "wa.me", sin ningun proveedor de SMS de pago) - el contacto no necesita tener la app.
  const handleShareWithContact = (contact) => {
    if (!trip?.shareToken) return
    const url = `${window.location.origin}/track/${trip.shareToken}`
    const text = `Hola ${contact.name}, voy en un viaje con NexoraTaxis, aquí puedes seguirlo en tiempo real: ${url}`
    window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleAddTrustedContact = async (e) => {
    e.preventDefault()
    setContactsError('')
    setSavingContact(true)
    try {
      await passengerApi.createTrustedContact({ name: newContactName.trim(), phone: newContactPhone.trim() })
      setNewContactName('')
      setNewContactPhone('')
      loadTrustedContacts()
    } catch (err) {
      setContactsError(err.response?.data?.message || 'No se pudo guardar el contacto')
    } finally {
      setSavingContact(false)
    }
  }

  const handleDeleteTrustedContact = async (contact) => {
    const ok = await confirm({
      title: 'Eliminar contacto de confianza',
      message: `Se eliminará a ${contact.name} de tus contactos de confianza.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    await passengerApi.deleteTrustedContact(contact.id).catch(() => {})
    loadTrustedContacts()
  }

  const startEditStop = (stop) => {
    setEditingStop(stop)
    setEditQuery('')
    setEditError('')
  }

  const handleEditStopSelect = async (result) => {
    setEditSearching(true)
    setEditError('')
    try {
      const { data } =
        editingStop === 'origin'
          ? await updateTripOrigin(trip.id, { originLat: result.lat, originLng: result.lng, originAddress: result.displayName })
          : await updateTripDestination(trip.id, { destinationLat: result.lat, destinationLng: result.lng, destinationAddress: result.displayName })
      setTrip(data.data)
      setEditingStop(null)
      setEditQuery('')
    } catch (err) {
      setEditError(err.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setEditSearching(false)
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
    setTripOptions({ babySeat: false, moreThanFourPassengers: false, hasPet: false, requiresWheelchairAccessible: false, comments: '' })
  }

  const mapDriver = useMemo(() => driverLive, [driverLive])

  // Solo mientras el operador va en camino a recoger (ACCEPTED): una vez que el viaje inicia, el
  // origen deja de ser el punto de encuentro relevante.
  const etaToPickupMin = useMemo(() => {
    if (!trip || trip.status !== 'ACCEPTED' || !driverLive) return null
    const distanceKm = haversineKm(driverLive, { lat: trip.originLat, lng: trip.originLng })
    if (distanceKm == null) return null
    return Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.status, trip?.originLat, trip?.originLng, driverLive])

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
            <span className="text-right">
              <span className="block font-bold text-ink-900">${totalToPay(preview.estimatedFare, preview.passengerServiceFee)} MXN</span>
              {Number(preview.passengerServiceFee) > 0 && (
                <span className="block text-[11px] text-ink-400">incluye ${preview.passengerServiceFee} de servicio</span>
              )}
            </span>
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
          <div className="space-y-4">
            <ProfileSidebar
              profile={profile}
              totalTrips={stats?.totalTrips}
              onOpenRatings={openRatings}
              onOpenHistory={openHistory}
              onUploadPhoto={handleUploadPhoto}
              uploadingPhoto={uploadingPhoto}
              photoError={photoError}
              onRequestDeletion={handleRequestAccountDeletion}
              onOpenContacts={() => setContactsOpen(true)}
            />
            <ReferralCard />
          </div>
        ) : null
      }
    >
      <ConfirmDialogElement />
      <RatingsModal open={ratingsOpen} onClose={() => setRatingsOpen(false)} ratings={ratings} loading={ratingsLoading} title="Tus calificaciones" />
      <CancelTripModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancelTrip} busy={cancelBusy} />
      <ReportTripModal
        open={Boolean(reportTripId)}
        onClose={() => setReportTripId(null)}
        onSubmit={(data) => reportTrip(reportTripId, data)}
      />
      <DetailListModal
        open={Boolean(historyModal)}
        onClose={() => setHistoryModal(null)}
        title={historyModal?.title}
        loading={historyLoading}
        items={historyModal && tripHistory ? tripHistory.filter(historyModal.filterFn) : null}
        renderItem={(t) => (
          <TripHistoryRow
            trip={t}
            onReport={(trip) => {
              // Cerrar el modal de historial antes de abrir el de reporte: ambos son overlays de
              // pantalla completa (mismo z-index) y si los dos quedan montados a la vez, el que se
              // declara despues en el JSX (el de historial) pinta encima y bloquea los clics del
              // formulario de reporte que esta debajo.
              setHistoryModal(null)
              setReportTripId(trip.id)
            }}
          />
        )}
        emptyMessage="No hay viajes que coincidan con esto todavía."
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
        <NotificationPermissionBanner permission={notifPermission} onRequest={requestNotifPermission} />
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

        {!activeTrip && !finishedTrip && !scheduledTrip && !noDriversTrip && stats && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={ListChecks}
              label="Finalizados hoy"
              value={stats.tripsCompletedToday}
              tone="brand"
              onClick={() => openStatModal('Viajes finalizados hoy', (t) => t.status === 'COMPLETED' && isToday(t.completedAt))}
            />
            <StatCard
              icon={UserX}
              label="Cancelados por el operador"
              value={stats.tripsCancelledByDriverToday}
              onClick={() =>
                openStatModal('Cancelados por el operador hoy', (t) => t.status === 'CANCELLED' && t.cancelledByRole === 'DRIVER' && isToday(t.cancelledAt))
              }
            />
            <StatCard
              icon={XCircle}
              label="Cancelados por mí"
              value={stats.tripsCancelledByMeToday}
              onClick={() =>
                openStatModal('Cancelados por mí hoy', (t) => t.status === 'CANCELLED' && t.cancelledByRole === 'PASSENGER' && isToday(t.cancelledAt))
              }
            />
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
              defaultCenter={defaultCenter}
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
                  <AddressAutocomplete
                    value={destinationQuery || destinationAddress}
                    onChange={(text) => {
                      setDestinationQuery(text)
                      // Si ya habia una direccion elegida y el usuario sigue escribiendo, esa
                      // seleccion ya no es valida - se limpia para obligar a elegir de nuevo de la
                      // lista antes de poder pedir el viaje (si no, se podia pedir un viaje con un
                      // texto que ya no correspondia a esas coordenadas).
                      if (destination) {
                        setDestination(null)
                        setDestinationAddress('')
                      }
                    }}
                    onSelect={(result) => {
                      setDestination({ lat: result.lat, lng: result.lng })
                      setDestinationAddress(result.displayName)
                      setDestinationQuery('')
                    }}
                    near={origin}
                    placeholder="Escribe una dirección..."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {savedPlaces.map((place) => {
                    const Icon = savedPlaceIcon(place.label)
                    return (
                      <span
                        key={place.id}
                        className="group flex items-center gap-1 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-2 text-xs font-medium text-ink-700"
                      >
                        <button
                          type="button"
                          onClick={() => selectSavedPlace(place)}
                          className="flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:text-brand-700"
                        >
                          <Icon className="h-3.5 w-3.5" /> {place.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedPlace(place)}
                          aria-label={`Eliminar ${place.label}`}
                          className="text-ink-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                  <button
                    type="button"
                    disabled={!destination}
                    onClick={() => setAddPlaceOpen(true)}
                    title={destination ? 'Guardar este destino como favorito' : 'Primero elige un destino'}
                    className="flex items-center gap-1 rounded-full border border-dashed border-ink-200 px-2 py-1 text-xs font-medium text-ink-500 hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" /> Guardar favorito
                  </button>
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
            <Switch
              label="Necesito auto con acceso para silla de ruedas"
              checked={tripOptions.requiresWheelchairAccessible}
              onChange={(v) => setTripOptions((o) => ({ ...o, requiresWheelchairAccessible: v }))}
            />
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

        <Modal open={addPlaceOpen} onClose={() => setAddPlaceOpen(false)} title="Guardar dirección favorita">
          <p className="mb-3 text-xs text-ink-500">{destinationAddress}</p>
          <div className="mb-3 flex gap-2">
            {['Casa', 'Trabajo'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNewPlaceLabel(preset)}
                className={`rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition ${
                  newPlaceLabel === preset ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-500 hover:border-ink-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <Label>Nombre</Label>
          <Input value={newPlaceLabel} onChange={(e) => setNewPlaceLabel(e.target.value)} placeholder="Ej. Casa de mi mamá" maxLength={40} />
          {savedPlaceError && <p className="mt-2 text-xs text-red-600">{savedPlaceError}</p>}
          <Button
            variant="brand"
            className="mt-4 w-full"
            loading={savingPlace}
            disabled={!newPlaceLabel.trim()}
            onClick={handleSaveCurrentDestination}
          >
            Guardar
          </Button>
        </Modal>

        <Modal open={contactsOpen} onClose={() => setContactsOpen(false)} title="Contactos de confianza" subtitle="Compárteles tus viajes en tiempo real por WhatsApp">
          <div className="space-y-2">
            {trustedContacts.length === 0 ? (
              <p className="text-xs text-ink-400">Aún no tienes contactos guardados.</p>
            ) : (
              trustedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{contact.name}</p>
                    <p className="text-xs text-ink-500">{contact.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrustedContact(contact)}
                    aria-label={`Eliminar ${contact.name}`}
                    className="text-ink-300 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddTrustedContact} className="mt-4 space-y-3 border-t border-ink-100 pt-4">
            <div>
              <Label>Nombre</Label>
              <Input required value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Ej. Mi mamá" maxLength={80} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input required value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="10 dígitos" maxLength={20} />
            </div>
            {contactsError && <p className="text-xs text-red-600">{contactsError}</p>}
            <Button type="submit" variant="brand" className="w-full" loading={savingContact} disabled={!newContactName.trim() || !newContactPhone.trim()}>
              Agregar contacto
            </Button>
          </form>
        </Modal>

        <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Ayuda">
          <div className="space-y-2">
            {HELP_FAQS.map((faq, i) => (
              <div key={faq.q} className="rounded-xl border border-ink-100">
                <button
                  type="button"
                  onClick={() => setHelpFaqOpen(helpFaqOpen === i ? null : i)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink-900"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${helpFaqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {helpFaqOpen === i && <p className="px-3 pb-2.5 text-xs text-ink-600">{faq.a}</p>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-400">¿Sigues con dudas? Escríbele al operador por el chat durante tu viaje.</p>
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
              // Una vez que el viaje ya inicio (el pasajero ya subio), el punto de origen deja de
              // ser relevante - mostrarlo junto al taxi (que ahora va camino al destino, no al
              // origen) solo confunde, asi que se oculta y el mapa se centra en taxi+destino.
              origin={activeTrip.status === 'IN_PROGRESS' ? null : origin}
              destination={destination}
              driver={mapDriver}
              routeGeometry={activeTrip.routeGeometry}
              height={MAP_HEIGHT}
              myLocation={gpsOrigin}
              defaultCenter={defaultCenter}
            />

            <Card>
              {etaToPickupMin != null && (
                <p className="mb-3 text-center text-lg font-bold text-ink-900">
                  Encuentro en <span className="text-brand-700">{etaToPickupMin} min</span>
                </p>
              )}
              <div className="mb-4">
                <TripStatusStepper status={activeTrip.status} />
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 pt-4">
                <Badge tone={STATUS_COPY[activeTrip.status]?.tone}>{STATUS_COPY[activeTrip.status]?.label}</Badge>
                <span className="text-sm font-bold text-ink-900">${totalToPay(activeTrip.estimatedFare, activeTrip.passengerServiceFee)} MXN</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {activeTrip.distanceKm} km &middot; ~{Math.round(activeTrip.durationMin)} min &middot;{' '}
                {activeTrip.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
                {Number(activeTrip.passengerServiceFee) > 0 && ` · incluye $${activeTrip.passengerServiceFee} de servicio`}
              </p>

              {activeTrip.status === 'ACCEPTED' && verificationCode && (
                <div className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-800">
                    <KeyRound className="h-3.5 w-3.5" /> PIN de este viaje · dilo al operador al subir
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    {verificationCode.split('').map((digit, i) => (
                      <span
                        key={i}
                        className="flex h-10 w-9 items-center justify-center rounded-lg bg-white text-xl font-extrabold text-brand-900 shadow-sm"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTrip.paymentMethod === 'TRANSFER' && activeTrip.driverBankAccount && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-xs text-ink-700">
                  <CreditCard className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  <span>
                    Cuenta/CLABE del operador: <span className="font-semibold">{activeTrip.driverBankAccount}</span>
                  </span>
                </div>
              )}

              {activeTrip.driverName && (
                <div className="mt-4 rounded-xl bg-ink-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 -space-x-3">
                      {activeTrip.taxiPhotoUrl && (
                        <img
                          src={`${API_URL}${activeTrip.taxiPhotoUrl}`}
                          alt=""
                          className="h-12 w-12 rounded-xl border-2 border-ink-50 object-cover"
                        />
                      )}
                      {activeTrip.driverPhotoUrl ? (
                        <img src={`${API_URL}${activeTrip.driverPhotoUrl}`} alt="" className="h-12 w-12 rounded-full border-2 border-ink-50 object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-50 bg-ink-900 text-sm font-bold text-white">
                          {activeTrip.driverName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold tracking-wide text-ink-900">{activeTrip.taxiPlates}</p>
                      <p className="truncate text-xs text-ink-500">
                        {[activeTrip.taxiBrand, activeTrip.taxiModel].filter(Boolean).join(' ') || `Unidad ${activeTrip.taxiUnitNumber}`}
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
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 text-xs text-ink-600">
                    <span className="font-semibold text-ink-900">{activeTrip.driverName}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {activeTrip.driverRating}
                    </span>
                    {activeTrip.driverTripsCompleted > 0 && (
                      <>
                        <span className="text-ink-400">&middot;</span>
                        <span>Más de {activeTrip.driverTripsCompleted} viajes</span>
                      </>
                    )}
                    {activeTrip.driverExcellent && <Badge tone="warning">Conductor excelente</Badge>}
                    <span className="text-ink-400">&middot;</span>
                    <span>Unidad {activeTrip.taxiUnitNumber}</span>
                  </div>
                </div>
              )}

              {(activeTrip.originAddress || activeTrip.destinationAddress) && (
                <div className="mt-3 space-y-2 rounded-xl border border-ink-100 p-3 text-xs">
                  {activeTrip.originAddress && (
                    <div className="flex items-start gap-2 text-ink-700">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="min-w-0 flex-1 truncate">{activeTrip.originAddress}</span>
                      {activeTrip.status !== 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => startEditStop('origin')}
                          className="flex shrink-0 items-center gap-1 text-ink-400 hover:text-brand-700"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                      )}
                    </div>
                  )}
                  {editingStop === 'origin' && (
                    <div className="rounded-lg bg-ink-50 p-2">
                      <AddressAutocomplete
                        autoFocus
                        placeholder="Nueva dirección de origen..."
                        value={editQuery}
                        onChange={setEditQuery}
                        onSelect={handleEditStopSelect}
                        near={{ lat: activeTrip.originLat, lng: activeTrip.originLng }}
                      />
                      {editSearching && <p className="mt-1 text-[11px] text-ink-400">Guardando...</p>}
                      {editError && <p className="mt-1 text-[11px] text-red-600">{editError}</p>}
                      <button type="button" onClick={() => setEditingStop(null)} className="mt-1 text-[11px] font-semibold text-ink-500 hover:underline">
                        Cancelar
                      </button>
                    </div>
                  )}
                  {activeTrip.destinationAddress && (
                    <div className="flex items-start gap-2 text-ink-700">
                      <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="min-w-0 flex-1 truncate">{activeTrip.destinationAddress}</span>
                      <button
                        type="button"
                        onClick={() => startEditStop('destination')}
                        className="flex shrink-0 items-center gap-1 text-ink-400 hover:text-brand-700"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                    </div>
                  )}
                  {editingStop === 'destination' && (
                    <div className="rounded-lg bg-ink-50 p-2">
                      <AddressAutocomplete
                        autoFocus
                        placeholder="Nueva dirección de destino..."
                        value={editQuery}
                        onChange={setEditQuery}
                        onSelect={handleEditStopSelect}
                        near={{ lat: activeTrip.originLat, lng: activeTrip.originLng }}
                      />
                      {editSearching && <p className="mt-1 text-[11px] text-ink-400">Guardando...</p>}
                      {editError && <p className="mt-1 text-[11px] text-red-600">{editError}</p>}
                      <button type="button" onClick={() => setEditingStop(null)} className="mt-1 text-[11px] font-semibold text-ink-500 hover:underline">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTrip.driverName && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleShareTrip}
                    className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                  >
                    <Share2 className="h-4 w-4" />
                    {shareCopied ? 'Enlace copiado' : 'Compartir viaje'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTripId(activeTrip.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reportar un problema
                  </button>
                  <a
                    href="tel:911"
                    className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                  >
                    <Siren className="h-4 w-4" />
                    Llamar al 911
                  </a>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Ayuda
                  </button>
                </div>
              )}

              {trustedContacts.length > 0 && (
                <div className="mt-3 rounded-xl border border-ink-100 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
                    <Users className="h-3.5 w-3.5" /> Avisar a un contacto de confianza
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trustedContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleShareWithContact(contact)}
                        className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                      >
                        {contact.name}
                      </button>
                    ))}
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
                {finishedTrip.status === 'COMPLETED' && (
                  <span className="text-lg font-bold text-ink-900">
                    ${totalToPay(finishedTrip.estimatedFare, finishedTrip.passengerServiceFee)} MXN
                  </span>
                )}
              </div>
              {finishedTrip.driverName && (
                <button
                  type="button"
                  onClick={() => setReportTripId(finishedTrip.id)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Reportar un problema
                </button>
              )}
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
