import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Users,
  Car,
  Clock,
  Banknote,
  Plus,
  AlertCircle,
  CheckCircle2,
  Ban,
  Star,
  Phone,
  Mail,
  CreditCard,
  Pencil,
  Trophy,
  MapPinned,
  MapPin,
  Flag,
  Search,
  RefreshCw,
  ClipboardList,
  UserRound,
} from 'lucide-react'
import Layout from '../components/Layout'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import RatingsModal from '../components/RatingsModal'
import DetailListModal from '../components/DetailListModal'
import PhotoPicker from '../components/ui/PhotoPicker'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { Label, Input, Select } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/map/MapView'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, LIVE_MAP_POLL_MS } from '../config'
import * as adminApi from '../api/admin'

const API_URL = import.meta.env.VITE_API_URL || ''
const photoSrc = (url) => (url ? `${API_URL}${url}` : null)

const NAV_SUPER_ADMIN = [
  { key: 'organizaciones', label: 'Organizaciones', icon: Building2 },
  { key: 'operadores', label: 'Operadores', icon: Users },
  { key: 'taxis', label: 'Taxis', icon: Car },
  { key: 'solicitudes', label: 'Solicitudes de taxi', icon: ClipboardList },
  { key: 'tarifas', label: 'Tarifas', icon: Banknote },
  { key: 'usuarios', label: 'Usuarios', icon: UserRound },
  { key: 'mapa', label: 'Mapa en vivo', icon: MapPinned },
]
const NAV_ADMIN = NAV_SUPER_ADMIN.filter((t) => !['organizaciones', 'mapa', 'usuarios'].includes(t.key))

export default function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const nav = isSuperAdmin ? NAV_SUPER_ADMIN : NAV_ADMIN
  const [tab, setTab] = useState(nav[0].key)
  const [organizations, setOrganizations] = useState([])
  const [actingOrgId, setActingOrgId] = useState('')

  useEffect(() => {
    if (isSuperAdmin) {
      adminApi.listOrganizations().then(({ data }) => setOrganizations(data.data))
    }
  }, [isSuperAdmin])

  // Para un ADMIN normal, el scope siempre es su propia organizacion. Para SUPER_ADMIN, "actua
  // como" la organizacion que elija arriba (igual que en el POS con las tiendas).
  const orgId = isSuperAdmin ? (actingOrgId ? Number(actingOrgId) : null) : user.organizationId

  // Al cambiar de pestaña, la organizacion "en turno" se reinicia: entrar a otra pestaña y
  // regresar no debe dejar seleccionada la organizacion de la visita anterior.
  const handleSetTab = (key) => {
    setTab(key)
    setActingOrgId('')
  }

  const sidebar = (
    <nav className="space-y-1 rounded-2xl border border-ink-100 bg-white p-2 shadow-sm shadow-ink-900/[0.02] lg:sticky lg:top-20">
      {nav.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => handleSetTab(key)}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            tab === key ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
          {label}
        </button>
      ))}
    </nav>
  )

  const needsOrgPicker = isSuperAdmin && !['organizaciones', 'mapa', 'usuarios', 'solicitudes'].includes(tab)

  return (
    <Layout title="Panel de administración" subtitle={isSuperAdmin ? 'Vista global de la plataforma' : user.organizationName} wide sidebar={sidebar}>
      {needsOrgPicker && (
        <Card className="mb-5">
          <Label>Organización a administrar</Label>
          <Select value={actingOrgId} onChange={(e) => setActingOrgId(e.target.value)}>
            <option value="">Selecciona una organización...</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Card>
      )}

      {tab === 'organizaciones' && isSuperAdmin && <OrganizationsSection onChange={() => adminApi.listOrganizations().then(({ data }) => setOrganizations(data.data))} />}
      {tab === 'operadores' && <DriversSection orgId={orgId} isSuperAdmin={isSuperAdmin} />}
      {tab === 'taxis' && <TaxisSection orgId={orgId} isSuperAdmin={isSuperAdmin} />}
      {tab === 'solicitudes' && <TaxiChangeRequestsSection />}
      {tab === 'tarifas' && <TariffsSection orgId={orgId} isSuperAdmin={isSuperAdmin} organizations={organizations} />}
      {tab === 'usuarios' && isSuperAdmin && <UsersSection />}
      {tab === 'mapa' && <LiveMapSection />}
    </Layout>
  )
}

function AlertBox({ tone = 'danger', children }) {
  const styles = tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
  const Icon = tone === 'danger' ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${styles}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {children}
    </div>
  )
}

function ListRow({ avatar, title, subtitle, right, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-3 border-b border-ink-50 px-5 py-3.5 last:border-0 ${onClick ? 'cursor-pointer hover:bg-ink-50/70' : ''} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
          <p className="truncate text-xs text-ink-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {right}
      </div>
    </div>
  )
}

function ToggleBadge({ active, onClick, activeLabel = 'Activo', inactiveLabel = 'Baja' }) {
  return (
    <button onClick={onClick}>
      <Badge tone={active ? 'success' : 'neutral'} icon={active ? CheckCircle2 : Ban}>
        {active ? activeLabel : inactiveLabel}
      </Badge>
    </button>
  )
}

function Avatar({ url, fallback, rounded = 'rounded-full', icon: Icon }) {
  const [broken, setBroken] = useState(false)
  if (url && !broken) {
    return <img src={photoSrc(url)} alt="" onError={() => setBroken(true)} className={`h-10 w-10 shrink-0 object-cover ${rounded}`} />
  }
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center bg-ink-900/[0.05] text-ink-600 ${rounded}`}>
      {Icon ? <Icon className="h-4.5 w-4.5" /> : fallback}
    </span>
  )
}

/* ---------------------------- Organizaciones ---------------------------- */

function OrganizationsSection({ onChange }) {
  const [orgs, setOrgs] = useState([])
  const [name, setName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [listModal, setListModal] = useState(null)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => {
    adminApi.listOrganizations().then(({ data }) => setOrgs(data.data))
    onChange?.()
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await adminApi.createOrganization({ name, contactPhone: contactPhone || null })
      setName('')
      setContactPhone('')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la organización')
    }
  }

  const toggleActive = async (org) => {
    const ok = await confirm({
      title: org.active ? 'Dar de baja organización' : 'Reactivar organización',
      message: org.active
        ? `${org.name} y todo su equipo perderán acceso a la plataforma. ¿Continuar?`
        : `${org.name} y su equipo recuperarán acceso a la plataforma. ¿Continuar?`,
      danger: org.active,
      confirmLabel: org.active ? 'Dar de baja' : 'Reactivar',
    })
    if (!ok) return
    await adminApi.setOrganizationActive(org.id, !org.active)
    load()
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      {detail && <OrganizationDetailModal org={detail} onClose={() => setDetail(null)} onSaved={load} />}
      <DetailListModal
        open={Boolean(listModal)}
        onClose={() => setListModal(null)}
        title={listModal?.title}
        items={listModal?.items}
        emptyMessage="Sin organizaciones que mostrar."
        renderItem={(o) => (
          <button
            type="button"
            onClick={() => {
              setListModal(null)
              setDetail(o)
            }}
            className="flex w-full items-center gap-3 text-left"
          >
            <Avatar url={o.logoUrl} icon={Building2} rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{o.name}</p>
              <p className="truncate text-xs text-ink-500">{o.contactPhone || 'Sin teléfono'}</p>
            </div>
            <Badge tone={o.active ? 'success' : 'neutral'}>{o.active ? 'Activa' : 'Baja'}</Badge>
          </button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Organizaciones"
          value={orgs.length}
          tone="brand"
          onClick={() => setListModal({ title: 'Organizaciones', items: orgs })}
        />
        <StatCard
          icon={CheckCircle2}
          label="Activas"
          value={orgs.filter((o) => o.active).length}
          tone="success"
          onClick={() => setListModal({ title: 'Organizaciones activas', items: orgs.filter((o) => o.active) })}
        />
      </div>

      <Card>
        <CardHeader icon={Plus} title="Nueva organización" subtitle="Da de alta una flotilla de taxis" />
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Label>Nombre de la organización</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="min-w-[160px] flex-1">
            <Label>Teléfono de contacto</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <Button type="submit" variant="brand" icon={Plus}>
            Crear
          </Button>
        </form>
        {error && (
          <div className="mt-3">
            <AlertBox>{error}</AlertBox>
          </div>
        )}
      </Card>

      <Card padded={false}>
        <CardHeader className="px-5 pt-5" title="Organizaciones registradas" subtitle={`${orgs.length} en total · toca una para ver el detalle`} />
        {orgs.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={Building2} title="Sin organizaciones aún" description="Crea la primera flotilla arriba." />
          </div>
        ) : (
          orgs.map((org) => (
            <ListRow
              key={org.id}
              onClick={() => setDetail(org)}
              avatar={<Avatar url={org.logoUrl} icon={Building2} rounded="rounded-xl" />}
              title={org.name}
              subtitle={org.contactPhone || 'Sin teléfono'}
              right={<ToggleBadge active={org.active} onClick={() => toggleActive(org)} />}
            />
          ))
        )}
      </Card>
    </div>
  )
}

function OrganizationDetailModal({ org, onClose, onSaved }) {
  const [name, setName] = useState(org.name)
  const [contactPhone, setContactPhone] = useState(org.contactPhone || '')
  const [logo, setLogo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [orgDrivers, setOrgDrivers] = useState(null)
  const [orgTaxis, setOrgTaxis] = useState(null)
  const [driverDetailId, setDriverDetailId] = useState(null)
  const [taxiDetailId, setTaxiDetailId] = useState(null)

  useEffect(() => {
    adminApi.listDrivers().then(({ data }) => setOrgDrivers(data.data.filter((d) => d.organizationId === org.id)))
    adminApi.listTaxis().then(({ data }) => setOrgTaxis(data.data.filter((t) => t.organizationId === org.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminApi.updateOrganization(org.id, { name, contactPhone: contactPhone || null })
      if (logo) await adminApi.uploadOrganizationLogo(org.id, logo)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={org.name} subtitle="Detalle y edición de la organización" wide>
      {driverDetailId && (
        <DriverDetailModal
          driverId={driverDetailId}
          onClose={() => setDriverDetailId(null)}
          onSaved={() => adminApi.listDrivers().then(({ data }) => setOrgDrivers(data.data.filter((d) => d.organizationId === org.id)))}
        />
      )}
      {taxiDetailId && (
        <TaxiDetailModal
          taxiId={taxiDetailId}
          onClose={() => setTaxiDetailId(null)}
          onSaved={() => adminApi.listTaxis().then(({ data }) => setOrgTaxis(data.data.filter((t) => t.organizationId === org.id)))}
        />
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <PhotoPicker value={logo} onChange={setLogo} existingUrl={org.logoUrl} rounded="rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Nombre</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label hint="opcional">Teléfono de contacto</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
        {error && <AlertBox>{error}</AlertBox>}
        <Button type="submit" variant="brand" icon={Pencil} loading={saving} className="w-full">
          Guardar cambios
        </Button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Operadores {orgDrivers ? `(${orgDrivers.length})` : ''}
          </p>
          {!orgDrivers ? (
            <p className="text-xs text-ink-400">Cargando...</p>
          ) : orgDrivers.length === 0 ? (
            <p className="text-xs text-ink-400">Sin operadores dados de alta todavía.</p>
          ) : (
            <div className="space-y-2">
              {orgDrivers.map((d) => (
                <button
                  key={d.driverId}
                  type="button"
                  onClick={() => setDriverDetailId(d.driverId)}
                  className="flex w-full items-center gap-3 rounded-xl border border-ink-100 px-3 py-2 text-left hover:bg-ink-50"
                >
                  <Avatar url={d.photoUrl} fallback={d.name.charAt(0)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{d.name}</p>
                    <p className="truncate text-xs text-ink-500">{d.phone}</p>
                  </div>
                  <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Activo' : 'Baja'}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Taxis {orgTaxis ? `(${orgTaxis.length})` : ''}</p>
          {!orgTaxis ? (
            <p className="text-xs text-ink-400">Cargando...</p>
          ) : orgTaxis.length === 0 ? (
            <p className="text-xs text-ink-400">Sin taxis dados de alta todavía.</p>
          ) : (
            <div className="space-y-2">
              {orgTaxis.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTaxiDetailId(t.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-ink-100 px-3 py-2 text-left hover:bg-ink-50"
                >
                  <Avatar url={t.photoUrl} icon={Car} rounded="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">Unidad {t.unitNumber}</p>
                    <p className="truncate text-xs text-ink-500">{t.plates}</p>
                  </div>
                  <Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Activo' : 'Baja'}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------- Operadores ------------------------------ */

const emptyDriverForm = { name: '', phone: '', email: '', bankAccount: '', address: '', taxiId: '' }

function DriversSection({ orgId, isSuperAdmin }) {
  const [allDrivers, setAllDrivers] = useState([])
  const [onlineDrivers, setOnlineDrivers] = useState([])
  const [allTaxis, setAllTaxis] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyDriverForm)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [detailTripsToday, setDetailTripsToday] = useState(null)
  const [minRatingCount, setMinRatingCount] = useState(0)
  const [listModal, setListModal] = useState(null)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => adminApi.listDrivers().then(({ data }) => setAllDrivers(data.data))
  const loadOnline = () => adminApi.listOnlineDrivers().then(({ data }) => setOnlineDrivers(data.data))
  useEffect(() => {
    load()
    loadOnline()
    adminApi.listTaxis().then(({ data }) => setAllTaxis(data.data))
    const interval = setInterval(loadOnline, LIVE_MAP_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  // Sin organizacion elegida arriba (vista del super admin), el operador se da de alta en el pool
  // de independientes (el backend lo resuelve solo) - ya no se le pide elegir organizacion aqui.
  const effectiveOrgId = orgId

  // Sin organizacion elegida arriba, el super admin ve TODOS los operadores de la plataforma (no
  // una lista vacia) - "sin filtro" significa "todas", no "ninguna".
  const drivers = isSuperAdmin && orgId ? allDrivers.filter((d) => d.organizationId === orgId) : allDrivers
  const onlineInScope = isSuperAdmin ? onlineDrivers.filter((o) => drivers.some((d) => d.driverId === o.driverId)) : onlineDrivers
  const taxis = (isSuperAdmin ? allTaxis.filter((t) => t.organizationId === effectiveOrgId) : allTaxis).filter((t) => t.active)

  // Ranking de los 3 mejor calificados (con al menos una calificacion), independiente del filtro
  // de abajo, para que el "top 3" no cambie solo porque se filtro la lista.
  const topRankedIds = useMemo(() => {
    return [...drivers]
      .filter((d) => d.ratingCount > 0)
      .sort((a, b) => b.ratingAvg - a.ratingAvg)
      .slice(0, 3)
      .map((d) => d.driverId)
  }, [drivers])

  // Los mejor rankeados deben aparecer primero en la lista, en orden (1°, 2°, 3°...), y despues
  // el resto - no solo llevar la insignia mientras quedan en cualquier posicion.
  const visibleDrivers = useMemo(() => {
    const filtered = drivers.filter((d) => d.ratingCount >= minRatingCount)
    const ranked = topRankedIds.map((id) => filtered.find((d) => d.driverId === id)).filter(Boolean)
    const rest = filtered.filter((d) => !topRankedIds.includes(d.driverId))
    return [...ranked, ...rest]
  }, [drivers, minRatingCount, topRankedIds])

  const openDetail = (driverId, tripsToday = null) => {
    setDetailId(driverId)
    setDetailTripsToday(tripsToday)
  }
  const closeDetail = () => {
    setDetailId(null)
    setDetailTripsToday(null)
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const taxiLabel = form.taxiId ? taxis.find((t) => String(t.id) === String(form.taxiId)) : null
    const ok = await confirm({
      title: 'Dar de alta operador',
      message: taxiLabel
        ? `Se creará una cuenta para ${form.name}, se le enviará una contraseña temporal y quedará asignado a la unidad ${taxiLabel.unitNumber}. ¿Continuar?`
        : `Se creará una cuenta para ${form.name} y se le enviará una contraseña temporal. ¿Continuar?`,
      confirmLabel: 'Dar de alta',
    })
    if (!ok) return
    setCreating(true)
    try {
      const { data } = await adminApi.createDriver({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        bankAccount: form.bankAccount || null,
        address: form.address || null,
        organizationId: effectiveOrgId || undefined,
        taxiId: form.taxiId ? Number(form.taxiId) : null,
      })
      if (photo) await adminApi.uploadDriverPhoto(data.data.driverId, photo).catch(() => {})
      setMessage(data.message)
      setForm(emptyDriverForm)
      setPhoto(null)
      setShowCreate(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el operador')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (driver) => {
    const ok = await confirm({
      title: driver.active ? 'Dar de baja operador' : 'Reactivar operador',
      message: driver.active
        ? `${driver.name} ya no podrá iniciar sesión ni recibir viajes. ¿Continuar?`
        : `${driver.name} podrá volver a iniciar sesión y recibir viajes. ¿Continuar?`,
      danger: driver.active,
      confirmLabel: driver.active ? 'Dar de baja' : 'Reactivar',
    })
    if (!ok) return
    await adminApi.setDriverActive(driver.driverId, !driver.active)
    load()
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      {detailId && <DriverDetailModal driverId={detailId} tripsToday={detailTripsToday} onClose={closeDetail} onSaved={load} />}
      <DetailListModal
        open={Boolean(listModal)}
        onClose={() => setListModal(null)}
        title={listModal?.title}
        items={listModal?.items}
        emptyMessage="Sin operadores que mostrar."
        renderItem={(d) => (
          <button
            type="button"
            onClick={() => {
              setListModal(null)
              openDetail(d.driverId, d.tripsCompletedToday)
            }}
            className="flex w-full items-center gap-3 text-left"
          >
            <Avatar url={d.photoUrl} fallback={d.name.charAt(0)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{d.name}</p>
              <p className="truncate text-xs text-ink-500">
                {d.phone}
                {d.ratingAvg !== undefined ? ` · ${d.ratingAvg}★ (${d.ratingCount})` : d.taxiUnitNumber ? ` · Unidad ${d.taxiUnitNumber}` : ' · Sin taxi asignado'}
              </p>
            </div>
            {d.active !== undefined ? (
              <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Activo' : 'Baja'}</Badge>
            ) : (
              <Badge tone={d.onTrip ? 'info' : 'success'}>{d.onTrip ? 'En viaje' : 'En línea'}</Badge>
            )}
          </button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Operadores" value={drivers.length} tone="brand" onClick={() => setListModal({ title: 'Operadores', items: drivers })} />
        <StatCard
          icon={Car}
          label="En viaje"
          value={onlineInScope.filter((d) => d.onTrip).length}
          tone="info"
          onClick={() => setListModal({ title: 'Operadores en viaje', items: onlineInScope.filter((d) => d.onTrip) })}
        />
        <StatCard
          icon={CheckCircle2}
          label="Conectados"
          value={onlineInScope.length}
          tone="success"
          onClick={() => setListModal({ title: 'Operadores conectados', items: onlineInScope })}
        />
      </div>

      <Card padded={false}>
        <CardHeader className="px-5 pt-5" title="Operadores conectados" subtitle={`${onlineInScope.length} en línea ahora mismo · toca uno para ver su detalle`} />
        {onlineInScope.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState illustration="noOneOnline" title="Nadie conectado" description="Aquí aparecerán los operadores en cuanto se conecten." />
          </div>
        ) : (
          onlineInScope.map((o) => (
            <ListRow
              key={o.driverId}
              onClick={() => openDetail(o.driverId, o.tripsCompletedToday)}
              avatar={<Avatar url={o.photoUrl} fallback={o.name.charAt(0)} />}
              title={o.name}
              subtitle={o.taxiUnitNumber ? `Unidad ${o.taxiUnitNumber} · ${o.tripsCompletedToday} viajes hoy` : `Sin taxi asignado · ${o.tripsCompletedToday} viajes hoy`}
              right={o.onTrip ? <Badge tone="info">En viaje</Badge> : <Badge tone="success">En línea</Badge>}
            />
          ))
        )}
      </Card>

      {message && (
        <AlertBox tone="success">{message}</AlertBox>
      )}

      {!showCreate ? (
        <Button type="button" variant="outline" icon={Plus} onClick={() => setShowCreate(true)} className="w-full">
          Dar de alta operador
        </Button>
      ) : (
      <Card>
        <CardHeader icon={Plus} title="Dar de alta operador" subtitle="Nombre, teléfono y foto; cuenta bancaria opcional" />
        <form onSubmit={handleCreate} className="space-y-3">
          <PhotoPicker value={photo} onChange={setPhoto} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nombre</Label>
              <Input required value={form.name} onChange={update('name')} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input required pattern="[0-9]{10}" value={form.phone} onChange={update('phone')} />
            </div>
            <div>
              <Label hint="opcional">Correo</Label>
              <Input type="email" value={form.email} onChange={update('email')} />
            </div>
            <div>
              <Label hint="opcional">Número de cuenta</Label>
              <Input value={form.bankAccount} onChange={update('bankAccount')} />
            </div>
            <div className="sm:col-span-2">
              <Label hint="opcional">Domicilio</Label>
              <Input value={form.address} onChange={update('address')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-ink-100 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label hint="opcional">Taxi a vincular</Label>
              <Select value={form.taxiId} onChange={(e) => setForm((f) => ({ ...f, taxiId: e.target.value }))}>
                <option value="">Sin asignar por ahora</option>
                {taxis.map((t) => (
                  <option key={t.id} value={t.id}>
                    Unidad {t.unitNumber} ({t.plates})
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-[11px] text-ink-400">
                Varios operadores pueden compartir un mismo taxi: solo uno puede estar conectado a la vez.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="brand" icon={Plus} loading={creating} className="flex-1">
              Dar de alta operador
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-3">
            <AlertBox>{error}</AlertBox>
          </div>
        )}
      </Card>
      )}

      <Card padded={false}>
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
          <CardHeader title="Operadores" subtitle={`${visibleDrivers.length} de ${drivers.length} · toca uno para ver el detalle y sus calificaciones`} />
          <div className="w-40">
            <Label hint="filtro">Mínimo de calificaciones</Label>
            <Input
              type="number"
              min={0}
              value={minRatingCount}
              onChange={(e) => setMinRatingCount(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>
        {visibleDrivers.length === 0 ? (
          <div className="px-5 pb-5 pt-3">
            <EmptyState icon={Users} title="Sin operadores que mostrar" description="Ajusta el filtro de calificaciones o da de alta un operador arriba." />
          </div>
        ) : (
          visibleDrivers.map((d) => {
            const rank = topRankedIds.indexOf(d.driverId)
            const lowRated = d.ratingCount > 0 && d.ratingAvg < 4.3
            return (
              <ListRow
                key={d.driverId}
                onClick={() => openDetail(d.driverId)}
                className={lowRated ? 'border-l-4 border-l-red-400 bg-red-50/60' : ''}
                avatar={<Avatar url={d.photoUrl} fallback={d.name.charAt(0)} />}
                title={d.name}
                subtitle={
                  <>
                    {d.phone} ·{' '}
                    <span className={lowRated ? 'font-semibold text-red-600' : ''}>
                      {d.ratingAvg}★ ({d.ratingCount})
                    </span>
                  </>
                }
                right={
                  <>
                    {rank !== -1 && (
                      <Badge tone="brand" icon={Trophy}>
                        Top {rank + 1}
                      </Badge>
                    )}
                    <ToggleBadge active={d.active} onClick={() => toggleActive(d)} />
                  </>
                }
              />
            )
          })
        )}
      </Card>
    </div>
  )
}

function DriverDetailModal({ driverId, tripsToday, onClose, onSaved }) {
  const [driver, setDriver] = useState(null)
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ratingsOpen, setRatingsOpen] = useState(false)
  const [ratings, setRatings] = useState(null)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [currentTrip, setCurrentTrip] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [taxiId, setTaxiId] = useState('')
  const [taxiBusy, setTaxiBusy] = useState(false)
  const [taxiError, setTaxiError] = useState('')
  const { confirm, ConfirmDialogElement } = useConfirm()

  const openRatings = () => {
    setRatingsOpen(true)
    setRatingsLoading(true)
    adminApi.driverRatings(driverId).then(({ data }) => setRatings(data.data)).finally(() => setRatingsLoading(false))
  }

  const loadDriver = () =>
    adminApi.getDriver(driverId).then(({ data }) => {
      setDriver(data.data)
      setForm({ name: data.data.name, email: data.data.email || '', bankAccount: data.data.bankAccount || '', address: data.data.address || '' })
      setTaxiId(data.data.taxiId ? String(data.data.taxiId) : '')
      adminApi.listTaxis().then(({ data: taxisRes }) => setTaxis(taxisRes.data.filter((t) => t.organizationId === data.data.organizationId && t.active)))
    })

  useEffect(() => {
    loadDriver()
    adminApi
      .driverCurrentTrip(driverId)
      .then(({ data }) => setCurrentTrip(data.data))
      .catch(() => setCurrentTrip(null))
  }, [driverId])

  const handleAssignTaxi = async (e) => {
    e.preventDefault()
    setTaxiError('')
    const taxiLabel = taxiId ? taxis.find((t) => String(t.id) === String(taxiId)) : null
    const ok = await confirm({
      title: taxiId ? 'Cambiar taxi del operador' : 'Quitar el taxi del operador',
      message: taxiLabel
        ? `${driver.name} quedará vinculado a la unidad ${taxiLabel.unitNumber} (${taxiLabel.plates}). Varios operadores pueden compartir un mismo taxi, solo uno puede estar conectado a la vez. ¿Continuar?`
        : `${driver.name} ya no tendrá ningún taxi vinculado. ¿Continuar?`,
      confirmLabel: 'Guardar',
    })
    if (!ok) return
    setTaxiBusy(true)
    try {
      await adminApi.assignDriverTaxi(driverId, taxiId ? Number(taxiId) : null)
      await loadDriver()
      onSaved()
    } catch (err) {
      setTaxiError(err.response?.data?.message || 'No se pudo guardar el taxi')
    } finally {
      setTaxiBusy(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminApi.updateDriver(driverId, { name: form.name, email: form.email || null, bankAccount: form.bankAccount || null, address: form.address || null })
      if (photo) await adminApi.uploadDriverPhoto(driverId, photo)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!driver || !form) {
    return (
      <Modal open onClose={onClose} title="Cargando...">
        <p className="text-sm text-ink-400">Un momento...</p>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={driver.name} subtitle={driver.organizationName} wide>
      <ConfirmDialogElement />
      <RatingsModal open={ratingsOpen} onClose={() => setRatingsOpen(false)} ratings={ratings} loading={ratingsLoading} title={`Calificaciones de ${driver.name}`} />
      {currentTrip && (
        <div className="mb-4 space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink-900">Viaje actual</p>
            <Badge tone={currentTrip.status === 'IN_PROGRESS' ? 'success' : 'info'}>
              {currentTrip.status === 'IN_PROGRESS' ? 'En curso' : 'Yendo por el pasajero'}
            </Badge>
          </div>
          <div className="flex items-start gap-2 text-ink-700">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
            {currentTrip.originAddress}
          </div>
          <div className="flex items-start gap-2 text-ink-700">
            <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
            {currentTrip.destinationAddress}
          </div>
          <div className="flex items-center gap-2 text-ink-500">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Solicitado {new Date(currentTrip.requestedAt).toLocaleString()}
            {currentTrip.acceptedAt && ` · Aceptado ${new Date(currentTrip.acceptedAt).toLocaleTimeString()}`}
          </div>
          <div className="flex items-center justify-between border-t border-brand-200 pt-2">
            <p className="text-ink-700">
              <span className="font-semibold">{currentTrip.passengerName}</span> · {currentTrip.passengerPhone}
            </p>
            <p className="font-semibold text-ink-900">${currentTrip.estimatedFare} MXN</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <PhotoPicker value={photo} onChange={setPhoto} existingUrl={driver.photoUrl} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Nombre</Label>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={driver.phone} disabled icon={Phone} />
          </div>
          <div>
            <Label hint="opcional">Correo</Label>
            <Input icon={Mail} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label hint="opcional">Número de cuenta</Label>
            <Input icon={CreditCard} value={form.bankAccount} onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label hint="opcional">Domicilio</Label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
        </div>

        <button
          type="button"
          onClick={openRatings}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition hover:opacity-80 ${
            driver.ratingCount > 0 && driver.ratingAvg < 4.3 ? 'bg-red-50 text-red-700' : 'bg-ink-50 text-ink-600'
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          {driver.ratingAvg} de calificación promedio ({driver.ratingCount} viajes calificados) · ver comentarios
        </button>
        {tripsToday !== null && tripsToday !== undefined && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {tripsToday} viajes completados hoy en su turno
          </div>
        )}

        {error && <AlertBox>{error}</AlertBox>}
        <Button type="submit" variant="brand" icon={Pencil} loading={saving} className="w-full">
          Guardar cambios
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-ink-100 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Taxi</p>
        <p className="mb-3 text-xs text-ink-500">
          {driver.taxiUnitNumber
            ? `Actualmente vinculado a la unidad ${driver.taxiUnitNumber} (${driver.taxiPlates}).`
            : 'Este operador no tiene ningún taxi vinculado.'}{' '}
          Varios operadores pueden compartir un mismo taxi: solo uno puede estar conectado a la vez.
        </p>
        <form onSubmit={handleAssignTaxi} className="space-y-3">
          <Select value={taxiId} onChange={(e) => setTaxiId(e.target.value)}>
            <option value="">Sin taxi</option>
            {taxis.map((t) => (
              <option key={t.id} value={t.id}>
                Unidad {t.unitNumber} ({t.plates})
              </option>
            ))}
          </Select>
          {taxiError && <AlertBox>{taxiError}</AlertBox>}
          <Button type="submit" variant="brand" className="w-full" loading={taxiBusy}>
            Guardar
          </Button>
        </form>
      </div>
    </Modal>
  )
}

/* --------------------------------- Taxis --------------------------------- */

function TaxisSection({ orgId, isSuperAdmin }) {
  const [allTaxis, setAllTaxis] = useState([])
  const [form, setForm] = useState({ unitNumber: '', plates: '', brand: '', model: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [listModal, setListModal] = useState(null)
  const [allDrivers, setAllDrivers] = useState([])
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => adminApi.listTaxis().then(({ data }) => setAllTaxis(data.data))
  useEffect(() => {
    load()
    adminApi.listDrivers().then(({ data }) => setAllDrivers(data.data))
  }, [])

  const taxis = isSuperAdmin ? allTaxis.filter((t) => t.organizationId === orgId) : allTaxis

  // Operadores dados de alta en cada taxi, para mostrar cuantos y quienes son en el listado sin
  // tener que entrar al detalle de cada unidad.
  const driversByTaxiId = useMemo(() => {
    const map = new Map()
    allDrivers.forEach((d) => {
      if (!d.taxiId) return
      if (!map.has(d.taxiId)) map.set(d.taxiId, [])
      map.get(d.taxiId).push(d)
    })
    return map
  }, [allDrivers])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    const ok = await confirm({ title: 'Registrar taxi', message: `Se dará de alta la unidad ${form.unitNumber}. ¿Continuar?`, confirmLabel: 'Registrar' })
    if (!ok) return
    setCreating(true)
    try {
      const { data } = await adminApi.createTaxi({ ...form, organizationId: orgId || undefined })
      if (photo) await adminApi.uploadTaxiPhoto(data.data.id, photo).catch(() => {})
      setForm({ unitNumber: '', plates: '', brand: '', model: '' })
      setPhoto(null)
      setShowCreate(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el taxi')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (taxi) => {
    const ok = await confirm({
      title: taxi.active ? 'Dar de baja taxi' : 'Reactivar taxi',
      message: taxi.active
        ? `La unidad ${taxi.unitNumber} dejará de poder recibir viajes y turnos. ¿Continuar?`
        : `La unidad ${taxi.unitNumber} podrá volver a recibir viajes y turnos. ¿Continuar?`,
      danger: taxi.active,
      confirmLabel: taxi.active ? 'Dar de baja' : 'Reactivar',
    })
    if (!ok) return
    await adminApi.setTaxiActive(taxi.id, !taxi.active)
    load()
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      {detailId && <TaxiDetailModal taxiId={detailId} onClose={() => setDetailId(null)} onSaved={load} />}
      <DetailListModal
        open={Boolean(listModal)}
        onClose={() => setListModal(null)}
        title={listModal?.title}
        items={listModal?.items}
        emptyMessage="Sin taxis que mostrar."
        renderItem={(t) => (
          <button
            type="button"
            onClick={() => {
              setListModal(null)
              setDetailId(t.id)
            }}
            className="flex w-full items-center gap-3 text-left"
          >
            <Avatar url={t.photoUrl} icon={Car} rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">Unidad {t.unitNumber}</p>
              <p className="truncate text-xs text-ink-500">{t.plates}</p>
            </div>
            <Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Activo' : 'Baja'}</Badge>
          </button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Car} label="Taxis" value={taxis.length} tone="brand" onClick={() => setListModal({ title: 'Taxis', items: taxis })} />
        <StatCard
          icon={CheckCircle2}
          label="Activos"
          value={taxis.filter((t) => t.active).length}
          tone="success"
          onClick={() => setListModal({ title: 'Taxis activos', items: taxis.filter((t) => t.active) })}
        />
      </div>

      {!showCreate ? (
        <Button type="button" variant="outline" icon={Plus} onClick={() => setShowCreate(true)} className="w-full">
          Registrar taxi
        </Button>
      ) : (
      <Card>
        <CardHeader icon={Plus} title="Registrar taxi" subtitle="Número de unidad, placas y foto" />
        <form onSubmit={handleCreate} className="space-y-3">
          <PhotoPicker value={photo} onChange={setPhoto} rounded="rounded-xl" />
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <Label>Número de unidad</Label>
              <Input required value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} />
            </div>
            <div className="min-w-[140px] flex-1">
              <Label>Placas</Label>
              <Input required value={form.plates} onChange={(e) => setForm((f) => ({ ...f, plates: e.target.value }))} />
            </div>
            <div className="min-w-[140px] flex-1">
              <Label hint="opcional">Marca</Label>
              <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Nissan" />
            </div>
            <div className="min-w-[140px] flex-1">
              <Label hint="opcional">Modelo</Label>
              <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Versa" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="brand" icon={Plus} loading={creating} className="flex-1">
              Registrar
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-3">
            <AlertBox>{error}</AlertBox>
          </div>
        )}
      </Card>
      )}

      <Card padded={false}>
        <CardHeader className="px-5 pt-5" title="Flotilla" subtitle={`${taxis.length} unidades, por número de unidad · toca una para ver el detalle`} />
        {taxis.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={Car} title="Sin taxis aún" description="Registra la primera unidad arriba." />
          </div>
        ) : (
          taxis.map((t) => {
            const taxiDrivers = driversByTaxiId.get(t.id) || []
            const operatorsLabel =
              taxiDrivers.length === 0
                ? 'Sin operadores dados de alta'
                : `${taxiDrivers.length} operador${taxiDrivers.length === 1 ? '' : 'es'}: ${taxiDrivers.map((d) => d.name).join(', ')}`
            return (
              <ListRow
                key={t.id}
                onClick={() => setDetailId(t.id)}
                avatar={<Avatar url={t.photoUrl} icon={Car} rounded="rounded-xl" />}
                title={`Unidad ${t.unitNumber}`}
                subtitle={
                  <>
                    {t.brand || t.model ? `${t.plates} · ${[t.brand, t.model].filter(Boolean).join(' ')}` : t.plates}
                    <br />
                    <span className={taxiDrivers.length === 0 ? 'text-ink-400' : ''}>{operatorsLabel}</span>
                  </>
                }
                right={<ToggleBadge active={t.active} onClick={() => toggleActive(t)} />}
              />
            )
          })
        )}
      </Card>
    </div>
  )
}

function TaxiDetailModal({ taxiId, onClose, onSaved }) {
  const [taxi, setTaxi] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getTaxi(taxiId).then(({ data }) => {
      setTaxi(data.data)
      setForm({ unitNumber: data.data.unitNumber, plates: data.data.plates, brand: data.data.brand || '', model: data.data.model || '' })
    })
    adminApi.listDrivers().then(({ data }) => setDrivers(data.data.filter((d) => d.taxiId === taxiId)))
  }, [taxiId])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminApi.updateTaxi(taxiId, form)
      if (photo) await adminApi.uploadTaxiPhoto(taxiId, photo)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!taxi || !form) {
    return (
      <Modal open onClose={onClose} title="Cargando...">
        <p className="text-sm text-ink-400">Un momento...</p>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={`Unidad ${taxi.unitNumber}`} subtitle={taxi.organizationName} wide>
      <form onSubmit={handleSave} className="space-y-4">
        <PhotoPicker value={photo} onChange={setPhoto} existingUrl={taxi.photoUrl} rounded="rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Número de unidad</Label>
            <Input required value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} />
          </div>
          <div>
            <Label>Placas</Label>
            <Input required value={form.plates} onChange={(e) => setForm((f) => ({ ...f, plates: e.target.value }))} />
          </div>
          <div>
            <Label hint="opcional">Marca</Label>
            <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Nissan" />
          </div>
          <div>
            <Label hint="opcional">Modelo</Label>
            <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Versa" />
          </div>
        </div>
        {error && <AlertBox>{error}</AlertBox>}
        <Button type="submit" variant="brand" icon={Pencil} loading={saving} className="w-full">
          Guardar cambios
        </Button>
      </form>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Operadores vinculados</p>
        {drivers.length === 0 ? (
          <p className="text-xs text-ink-400">Ningún operador tiene este taxi vinculado todavía.</p>
        ) : (
          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.driverId} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-xs">
                <div>
                  <p className="font-medium text-ink-800">{d.name}</p>
                  <p className="text-ink-400">{d.phone}</p>
                </div>
                <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Activo' : 'Baja'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

/* -------------------------- Solicitudes de taxi ---------------------------- */

function TaxiChangeRequestsSection() {
  const [requests, setRequests] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => adminApi.listTaxiChangeRequests().then(({ data }) => setRequests(data.data))
  useEffect(() => {
    load()
  }, [])

  const handleResolve = async (request, approve) => {
    const ok = await confirm({
      title: approve ? 'Aprobar cambio de taxi' : 'Rechazar solicitud',
      message: approve
        ? `${request.driverName} quedará vinculado a la unidad ${request.requestedUnitNumber} (${request.requestedPlates}). ¿Continuar?`
        : `Se rechazará la solicitud de ${request.driverName}. ¿Continuar?`,
      danger: !approve,
      confirmLabel: approve ? 'Aprobar' : 'Rechazar',
    })
    if (!ok) return
    setBusyId(request.id)
    setError('')
    try {
      if (approve) await adminApi.approveTaxiChangeRequest(request.id)
      else await adminApi.rejectTaxiChangeRequest(request.id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo resolver la solicitud')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      <Card padded={false}>
        <CardHeader
          className="px-5 pt-5"
          icon={ClipboardList}
          title="Solicitudes de cambio de taxi"
          subtitle={`${requests.length} pendientes · un operador las crea desde su panel al querer cambiar de unidad`}
        />
        {error && (
          <div className="px-5 pb-3">
            <AlertBox>{error}</AlertBox>
          </div>
        )}
        {requests.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={ClipboardList} title="Sin solicitudes pendientes" description="Aquí aparecerán cuando un operador pida cambiar de taxi." />
          </div>
        ) : (
          requests.map((r) => (
            <ListRow
              key={r.id}
              avatar={
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.05] text-ink-600">
                  <Car className="h-4.5 w-4.5" />
                </span>
              }
              title={r.driverName}
              subtitle={`Unidad ${r.requestedUnitNumber} (${r.requestedPlates})${
                r.requestedBrand || r.requestedModel ? ` · ${[r.requestedBrand, r.requestedModel].filter(Boolean).join(' ')}` : ''
              }${r.reason ? ` · ${r.reason}` : ''}`}
              right={
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={busyId !== null} loading={busyId === r.id} onClick={() => handleResolve(r, false)}>
                    Rechazar
                  </Button>
                  <Button variant="brand" size="sm" disabled={busyId !== null} loading={busyId === r.id} onClick={() => handleResolve(r, true)}>
                    Aprobar
                  </Button>
                </div>
              }
            />
          ))
        )}
      </Card>
    </div>
  )
}

/* -------------------------------- Tarifas --------------------------------- */

function TariffsSection({ orgId, isSuperAdmin }) {
  const [form, setForm] = useState({ baseFare: '15.00', perKm: '8.00', minFare: '30.00' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await adminApi.upsertTariff({
        organizationId: isSuperAdmin ? orgId : undefined,
        baseFare: Number(form.baseFare),
        perKm: Number(form.perKm),
        minFare: Number(form.minFare),
      })
      setMessage('Tarifa guardada correctamente')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la tarifa')
    }
  }

  const isPlatformDefault = isSuperAdmin && !orgId

  return (
    <Card className="max-w-md">
      <CardHeader
        icon={Banknote}
        title={isPlatformDefault ? 'Tarifa por defecto de la plataforma' : 'Tarifa de la organización'}
        subtitle={
          isPlatformDefault
            ? 'Se usa para cualquier organización sin una tarifa propia. Base + costo por km, con un mínimo garantizado.'
            : 'Base + costo por km, con un mínimo garantizado'
        }
      />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Tarifa base ($)</Label>
          <Input type="number" step="0.01" value={form.baseFare} onChange={(e) => setForm((f) => ({ ...f, baseFare: e.target.value }))} />
        </div>
        <div>
          <Label>Costo por km ($)</Label>
          <Input type="number" step="0.01" value={form.perKm} onChange={(e) => setForm((f) => ({ ...f, perKm: e.target.value }))} />
        </div>
        <div>
          <Label>Tarifa mínima ($)</Label>
          <Input type="number" step="0.01" value={form.minFare} onChange={(e) => setForm((f) => ({ ...f, minFare: e.target.value }))} />
        </div>
        {error && <AlertBox>{error}</AlertBox>}
        {message && <AlertBox tone="success">{message}</AlertBox>}
        <Button type="submit" variant="brand" className="w-full">
          Guardar tarifa
        </Button>
      </form>
    </Card>
  )
}

function LiveMapSection() {
  const [drivers, setDrivers] = useState([])
  const [loadError, setLoadError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedTrip, setSelectedTrip] = useState(null)

  const load = () => {
    setRefreshing(true)
    return adminApi
      .listOnlineDrivers()
      .then(({ data }) => {
        setDrivers(data.data)
        setLoadError('')
        setLastUpdated(new Date())
      })
      .catch(() => setLoadError('No se pudo actualizar el mapa, reintentando...'))
      .finally(() => setRefreshing(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, LIVE_MAP_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selected?.onTrip) {
      setSelectedTrip(null)
      return
    }
    adminApi
      .driverCurrentTrip(selected.driverId)
      .then(({ data }) => setSelectedTrip(data.data))
      .catch(() => setSelectedTrip(null))
  }, [selected])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredDrivers = normalizedQuery
    ? drivers.filter((d) =>
        [d.name, d.taxiUnitNumber, d.taxiPlates].some((field) => field && field.toLowerCase().includes(normalizedQuery))
      )
    : drivers
  const located = filteredDrivers.filter((d) => d.lat != null && d.lng != null)

  return (
    <div className="space-y-4">
      <Card padded={false}>
        <CardHeader
          className="px-5 pt-5"
          title="Operadores conectados en el mapa"
          subtitle={`${located.length} de ${drivers.length} en línea con ubicación disponible${
            lastUpdated ? ` · actualizado ${lastUpdated.toLocaleTimeString()}` : ''
          }`}
          action={
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={load} loading={refreshing}>
              Actualizar
            </Button>
          }
        />
        <div className="px-5 pb-3">
          <Input icon={Search} placeholder="Buscar por nombre, # de taxi o placa..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {loadError && (
          <div className="px-5 pb-3">
            <AlertBox>{loadError}</AlertBox>
          </div>
        )}
        <div className="px-5 pb-5">
          <MapView
            availableDrivers={located.map((d) => ({ driverId: d.driverId, lat: d.lat, lng: d.lng }))}
            defaultCenter={DEFAULT_MAP_CENTER}
            defaultZoom={DEFAULT_MAP_ZOOM}
            height="480px"
          />
        </div>
      </Card>

      <Card padded={false}>
        {filteredDrivers.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              illustration="noOneOnline"
              title={drivers.length === 0 ? 'Nadie conectado' : 'Sin coincidencias'}
              description={
                drivers.length === 0
                  ? 'Aquí aparecerán los operadores en cuanto se conecten.'
                  : 'Ningún operador conectado coincide con esa búsqueda.'
              }
            />
          </div>
        ) : (
          filteredDrivers.map((d) => (
            <ListRow
              key={d.driverId}
              onClick={() => setSelected(d)}
              avatar={
                d.photoUrl ? (
                  <img src={photoSrc(d.photoUrl)} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                    {d.name.charAt(0)}
                  </span>
                )
              }
              title={d.name}
              subtitle={`${d.organizationName || 'Independiente'}${
                d.taxiUnitNumber ? ` · Unidad ${d.taxiUnitNumber}${d.taxiPlates ? ` (${d.taxiPlates})` : ''}` : ''
              }`}
              right={
                <div className="flex items-center gap-2">
                  {d.onTrip && <Badge tone="info">En viaje</Badge>}
                  <Badge tone={d.lat != null ? 'success' : 'neutral'}>{d.lat != null ? 'Con ubicación' : 'Sin ubicación'}</Badge>
                </div>
              }
            />
          ))
        )}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-2 text-sm text-ink-700">
            <p>
              <span className="font-semibold">Teléfono:</span> {selected.phone}
            </p>
            <p>
              <span className="font-semibold">Organización:</span> {selected.organizationName || 'Independiente'}
            </p>
            {selected.taxiUnitNumber && (
              <p>
                <span className="font-semibold">Unidad:</span> {selected.taxiUnitNumber}
                {selected.taxiPlates ? ` (${selected.taxiPlates})` : ''}
              </p>
            )}
            <p>
              <span className="font-semibold">Viajes hoy:</span> {selected.tripsCompletedToday}
            </p>
            <p>
              <span className="font-semibold">Estatus:</span> {selected.onTrip ? 'En viaje' : 'Disponible'}
            </p>
            {selectedTrip && (
              <div className="mt-2 space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs">
                <div className="flex items-start gap-2 text-ink-700">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                  {selectedTrip.originAddress}
                </div>
                <div className="flex items-start gap-2 text-ink-700">
                  <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                  {selectedTrip.destinationAddress}
                </div>
                <div className="flex items-center gap-2 text-ink-500">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Solicitado {new Date(selectedTrip.requestedAt).toLocaleString()}
                </div>
                <p className="border-t border-brand-200 pt-2 text-ink-700">
                  <span className="font-semibold">{selectedTrip.passengerName}</span> · {selectedTrip.passengerPhone}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

/* -------------------------------- Usuarios --------------------------------- */

function UsersSection() {
  const [passengers, setPassengers] = useState([])
  const [query, setQuery] = useState('')
  const [listModal, setListModal] = useState(null)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => adminApi.listPassengers().then(({ data }) => setPassengers(data.data))
  useEffect(() => {
    load()
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? passengers.filter((p) => [p.name, p.phone, p.email].some((field) => field && field.toLowerCase().includes(normalizedQuery)))
    : passengers

  const toggleActive = async (p) => {
    const ok = await confirm({
      title: p.active ? 'Dar de baja usuario' : 'Reactivar usuario',
      message: p.active
        ? `${p.name} ya no podrá iniciar sesión ni solicitar viajes. ¿Continuar?`
        : `${p.name} podrá volver a iniciar sesión y solicitar viajes. ¿Continuar?`,
      danger: p.active,
      confirmLabel: p.active ? 'Dar de baja' : 'Reactivar',
    })
    if (!ok) return
    await adminApi.setPassengerActive(p.passengerId, !p.active)
    load()
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      <DetailListModal
        open={Boolean(listModal)}
        onClose={() => setListModal(null)}
        title={listModal?.title}
        items={listModal?.items}
        emptyMessage="Sin usuarios que mostrar."
        renderItem={(p) => (
          <div className="flex w-full items-center gap-3 text-left">
            <Avatar url={p.photoUrl} fallback={p.name.charAt(0)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{p.name}</p>
              <p className="truncate text-xs text-ink-500">{p.phone}</p>
            </div>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={UserRound} label="Usuarios" value={passengers.length} tone="brand" onClick={() => setListModal({ title: 'Usuarios', items: passengers })} />
        <StatCard
          icon={CheckCircle2}
          label="Activos"
          value={passengers.filter((p) => p.active).length}
          tone="success"
          onClick={() => setListModal({ title: 'Usuarios activos', items: passengers.filter((p) => p.active) })}
        />
        <StatCard
          icon={Star}
          label="Con calificación"
          value={passengers.filter((p) => p.ratingCount > 0).length}
          onClick={() => setListModal({ title: 'Usuarios con calificación', items: passengers.filter((p) => p.ratingCount > 0) })}
        />
      </div>

      <Card padded={false}>
        <div className="px-5 pt-5">
          <Input icon={Search} placeholder="Buscar por nombre, teléfono o correo..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <CardHeader className="px-5 pt-4" title="Pasajeros" subtitle={`${filtered.length} de ${passengers.length} · clic para ver más`} />
        {filtered.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={UserRound} title="Sin usuarios que coincidan" description="Ajusta la búsqueda o espera a que se registren nuevos usuarios." />
          </div>
        ) : (
          filtered.map((p) => (
            <ListRow
              key={p.passengerId}
              avatar={<Avatar url={p.photoUrl} fallback={p.name.charAt(0)} />}
              title={p.name}
              subtitle={`${p.phone}${p.email ? ` · ${p.email}` : ''}${p.ratingCount > 0 ? ` · ${p.ratingAvg}★ (${p.ratingCount})` : ''}`}
              right={<ToggleBadge active={p.active} onClick={() => toggleActive(p)} />}
            />
          ))
        )}
      </Card>
    </div>
  )
}
