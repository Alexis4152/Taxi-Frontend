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
  AlertTriangle,
  SlidersHorizontal,
  Gift,
  UserPlus,
  Trash2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import Layout from '../components/Layout'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Switch from '../components/ui/Switch'
import RatingsModal from '../components/RatingsModal'
import DetailListModal from '../components/DetailListModal'
import PhotoPicker from '../components/ui/PhotoPicker'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { Label, Input, Select, Textarea } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import MapView from '../components/map/MapView'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, LIVE_MAP_POLL_MS } from '../config'
import * as adminApi from '../api/admin'
import { ARCO_TYPE_LABEL, ARCO_STATUS, formatDate } from '../data/arco'

const API_URL = import.meta.env.VITE_API_URL || ''
const photoSrc = (url) => (url ? `${API_URL}${url}` : null)

const NAV_SUPER_ADMIN = [
  { key: 'organizaciones', label: 'Organizaciones', icon: Building2 },
  { key: 'operadores', label: 'Operadores', icon: Users },
  { key: 'taxis', label: 'Taxis', icon: Car },
  { key: 'solicitudes', label: 'Solicitudes de taxi', icon: ClipboardList },
  { key: 'reportes', label: 'Reportes', icon: AlertTriangle },
  { key: 'tarifas', label: 'Tarifas', icon: Banknote },
  { key: 'usuarios', label: 'Usuarios', icon: UserRound },
  { key: 'arco', label: 'Solicitudes ARCO', icon: ShieldCheck },
  { key: 'mapa', label: 'Mapa en vivo', icon: MapPinned },
  { key: 'configuracion', label: 'Configuración', icon: SlidersHorizontal },
]
const NAV_ADMIN = NAV_SUPER_ADMIN.filter((t) => !['organizaciones', 'mapa', 'usuarios', 'arco', 'configuracion'].includes(t.key))

export default function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const nav = isSuperAdmin ? NAV_SUPER_ADMIN : NAV_ADMIN
  const [tab, setTab] = useState(nav[0].key)
  const [organizations, setOrganizations] = useState([])
  const [actingOrgId, setActingOrgId] = useState('')

  useEffect(() => {
    if (!isSuperAdmin) return undefined
    const load = () => adminApi.listOrganizations().then(({ data }) => setOrganizations(data.data))
    load()
    // La organizacion de "Operadores Independientes" se crea sola la primera vez que alguien se
    // autoregistra sin organizacion - si eso pasa despues de que el superadmin ya abrio el
    // panel, sin este polling nunca aparece en el selector hasta recargar la pagina.
    const interval = setInterval(load, LIVE_MAP_POLL_MS)
    return () => clearInterval(interval)
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
    <nav className="space-y-1 rounded-2xl border border-ink-100 bg-surface p-2 shadow-sm shadow-ink-900/[0.02] lg:sticky lg:top-20">
      {nav.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => handleSetTab(key)}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            tab === key ? 'bg-night-900 text-white' : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
          {label}
        </button>
      ))}
    </nav>
  )

  const needsOrgPicker = isSuperAdmin && !['organizaciones', 'mapa', 'usuarios', 'arco', 'solicitudes', 'reportes', 'configuracion'].includes(tab)

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
      {tab === 'reportes' && <TripReportsSection />}
      {tab === 'configuracion' && isSuperAdmin && <PlatformSettingsSection />}
      {tab === 'tarifas' && <TariffsSection orgId={orgId} isSuperAdmin={isSuperAdmin} organizations={organizations} />}
      {tab === 'usuarios' && isSuperAdmin && <UsersSection />}
      {tab === 'arco' && isSuperAdmin && <ArcoRequestsSection />}
      {tab === 'mapa' && <LiveMapSection />}
    </Layout>
  )
}

function AlertBox({ tone = 'danger', children }) {
  const styles =
    tone === 'danger'
      ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
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

const iconActionClass = 'flex h-8 w-8 items-center justify-center rounded-lg transition-colors'

/**
 * Botones de accion de una fila (estilo POS: editar / bloquear-desbloquear / eliminar). Mientras
 * esta "pendiente de eliminacion" se reemplaza el boton de eliminar por restaurar + borrar
 * definitivo, y se deshabilita el de bloquear (no tiene sentido tocarlo en ese estado).
 */
function RowActions({ active, pendingDeletion, onEdit, onToggleActive, onRequestDelete, onCancelDelete, onDeleteForever, hideDelete = false }) {
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {onEdit && (
        <button type="button" title="Modificar" onClick={onEdit} className={`${iconActionClass} bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25`}>
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        title={pendingDeletion ? 'Bloquear/desbloquear (deshabilitado)' : active ? 'Bloquear' : 'Desbloquear'}
        onClick={pendingDeletion ? undefined : onToggleActive}
        disabled={pendingDeletion}
        className={`${iconActionClass} ${pendingDeletion ? 'cursor-not-allowed bg-ink-50 text-ink-300' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25'}`}
      >
        <AlertTriangle className="h-4 w-4" />
      </button>
      {!hideDelete &&
        (pendingDeletion ? (
          <>
            <button type="button" title="Cancelar eliminación" onClick={onCancelDelete} className={`${iconActionClass} bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25`}>
              <RotateCcw className="h-4 w-4" />
            </button>
            <button type="button" title="Eliminar definitivamente" onClick={onDeleteForever} className={`${iconActionClass} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button type="button" title="Eliminar" onClick={onRequestDelete} className={`${iconActionClass} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25`}>
            <Trash2 className="h-4 w-4" />
          </button>
        ))}
    </div>
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
    const ok = await confirm({ title: 'Crear organización', message: `Se dará de alta "${name}". ¿Continuar?`, confirmLabel: 'Crear' })
    if (!ok) return
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
    if (org.active) {
      const reason = await confirm({
        title: 'Bloquear organización',
        message: `${org.name} y todo su equipo perderán acceso a la plataforma. El motivo quedará visible para revisión.`,
        danger: true,
        confirmLabel: 'Bloquear',
        requireInput: true,
        inputLabel: 'Motivo (opcional)',
        inputPlaceholder: 'Ej. Falta de pago, contrato terminado, etc.',
      })
      if (reason === null) return
      await adminApi.setOrganizationActive(org.id, false, reason)
      load()
      return
    }
    const ok = await confirm({
      title: 'Desbloquear organización',
      message: `${org.name} y su equipo recuperarán acceso a la plataforma. ¿Continuar?`,
      confirmLabel: 'Desbloquear',
    })
    if (!ok) return
    await adminApi.setOrganizationActive(org.id, true)
    load()
  }

  const requestDelete = async (org) => {
    const reason = await confirm({
      title: 'Eliminar organización',
      message: `${org.name} quedará bloqueada y marcada como pendiente de eliminación para que la revises antes de borrarla de forma definitiva.`,
      danger: true,
      confirmLabel: 'Marcar para eliminar',
      requireInput: true,
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ej. Organización dada de baja, duplicada, etc.',
    })
    if (reason === null) return
    await adminApi.markOrganizationPendingDeletion(org.id, reason)
    load()
  }

  const cancelDelete = async (org) => {
    const ok = await confirm({
      title: 'Cancelar eliminación',
      message: `Se quitará a ${org.name} de la lista de pendientes de eliminación. Seguirá bloqueada hasta que la desbloquees.`,
      confirmLabel: 'Cancelar eliminación',
    })
    if (!ok) return
    await adminApi.cancelOrganizationPendingDeletion(org.id)
    load()
  }

  const deleteForever = async (org) => {
    const ok = await confirm({
      title: 'Eliminar definitivamente',
      message: `Esta acción no se puede deshacer: se borrarán de forma permanente los datos de ${org.name}. Si tiene operadores, taxis u otros registros asociados, la eliminación se rechazará y seguirá pendiente.`,
      danger: true,
      confirmLabel: 'Eliminar para siempre',
    })
    if (!ok) return
    setError('')
    try {
      await adminApi.deleteOrganizationPermanently(org.id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar')
    }
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
            <Badge tone={o.active ? 'success' : 'neutral'}>{o.active ? 'Activa' : 'Bloqueada'}</Badge>
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
        {orgs.some((o) => o.pendingDeletion) && (
          <StatCard
            icon={Trash2}
            label="Solicitudes de eliminación"
            value={orgs.filter((o) => o.pendingDeletion).length}
            tone="danger"
            onClick={() => setListModal({ title: 'Pendientes de eliminación', items: orgs.filter((o) => o.pendingDeletion) })}
          />
        )}
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
              subtitle={
                <>
                  {org.contactPhone || 'Sin teléfono'}
                  {!org.active && org.deactivationReason && (
                    <>
                      {' · '}
                      <span className="font-medium text-red-600">Motivo: {org.deactivationReason}</span>
                    </>
                  )}
                </>
              }
              right={
                org.independentPool ? (
                  <Badge tone="brand">Pool del sistema</Badge>
                ) : (
                  <>
                    <Badge tone={org.pendingDeletion ? 'danger' : org.active ? 'success' : 'neutral'}>
                      {org.pendingDeletion ? 'Pend. eliminación' : org.active ? 'Activa' : 'Bloqueada'}
                    </Badge>
                    <RowActions
                      active={org.active}
                      pendingDeletion={org.pendingDeletion}
                      onEdit={() => setDetail(org)}
                      onToggleActive={() => toggleActive(org)}
                      onRequestDelete={() => requestDelete(org)}
                      onCancelDelete={() => cancelDelete(org)}
                      onDeleteForever={() => deleteForever(org)}
                    />
                  </>
                )
              }
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
  const { confirm, ConfirmDialogElement } = useConfirm()

  useEffect(() => {
    adminApi.listDrivers().then(({ data }) => setOrgDrivers(data.data.filter((d) => d.organizationId === org.id)))
    adminApi.listTaxis().then(({ data }) => setOrgTaxis(data.data.filter((t) => t.organizationId === org.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id])

  const handleSave = async (e) => {
    e.preventDefault()
    const ok = await confirm({ title: 'Guardar cambios', message: `Se actualizarán los datos de ${org.name}. ¿Continuar?`, confirmLabel: 'Guardar' })
    if (!ok) return
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
      <ConfirmDialogElement />
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
        <PhotoPicker value={logo} onChange={setLogo} existingUrl={photoSrc(org.logoUrl)} rounded="rounded-xl" />
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
                  <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Activo' : 'Bloqueado'}</Badge>
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
                  <Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Activo' : 'Bloqueado'}</Badge>
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
  const [viewMode, setViewMode] = useState('all') // 'all' | 'pending-payment'
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => adminApi.listDrivers().then(({ data }) => setAllDrivers(data.data))
  const loadOnline = () => adminApi.listOnlineDrivers().then(({ data }) => setOnlineDrivers(data.data))
  const loadTaxis = () => adminApi.listTaxis().then(({ data }) => setAllTaxis(data.data))
  useEffect(() => {
    load()
    loadOnline()
    loadTaxis()
    // Un operador puede autoregistrarse mientras esta pestaña ya esta abierta - sin este
    // polling, el superadmin no lo veria hasta cambiar de pestaña o recargar la pagina.
    const interval = setInterval(() => {
      load()
      loadOnline()
      loadTaxis()
    }, LIVE_MAP_POLL_MS)
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

  // De mayor a menor saldo pendiente - el que mas debe primero, para que el admin lo revise de
  // entrada sin tener que ordenar nada el mismo.
  const pendingPaymentDrivers = useMemo(
    () => drivers.filter((d) => Number(d.pendingAmount) > 0).sort((a, b) => Number(b.pendingAmount) - Number(a.pendingAmount)),
    [drivers]
  )

  const handleMarkPaidInList = async (driver) => {
    const ok = await confirm({
      title: 'Confirmar pago recibido',
      message: `Se marcará el saldo de ${driver.name} ($${driver.pendingAmount} MXN) como pagado y recuperará acceso para conectarse. ¿Continuar?`,
      confirmLabel: 'Confirmar pago',
    })
    if (!ok) return
    await adminApi.markDriverPaid(driver.driverId)
    load()
  }

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
    if (driver.active) {
      const reason = await confirm({
        title: 'Bloquear operador',
        message: `${driver.name} ya no podrá iniciar sesión ni recibir viajes. El motivo se le mostrará al intentar entrar.`,
        danger: true,
        confirmLabel: 'Bloquear',
        requireInput: true,
        inputLabel: 'Motivo (se le mostrará al operador)',
        inputPlaceholder: 'Ej. Documentación vencida, quejas reiteradas, etc.',
      })
      if (reason === null) return
      await adminApi.setDriverActive(driver.driverId, false, reason)
      load()
      return
    }
    const ok = await confirm({
      title: 'Desbloquear operador',
      message: `${driver.name} podrá volver a iniciar sesión y recibir viajes. ¿Continuar?`,
      confirmLabel: 'Desbloquear',
    })
    if (!ok) return
    await adminApi.setDriverActive(driver.driverId, true)
    load()
  }

  const requestDelete = async (driver) => {
    const reason = await confirm({
      title: 'Eliminar operador',
      message: `${driver.name} quedará bloqueado y marcado como pendiente de eliminación para que lo revises antes de borrarlo de forma definitiva.`,
      danger: true,
      confirmLabel: 'Marcar para eliminar',
      requireInput: true,
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ej. Cuenta duplicada, solicitó baja, etc.',
    })
    if (reason === null) return
    await adminApi.markDriverPendingDeletion(driver.driverId, reason)
    load()
  }

  const cancelDelete = async (driver) => {
    const ok = await confirm({
      title: 'Cancelar eliminación',
      message: `Se quitará a ${driver.name} de la lista de pendientes de eliminación. Seguirá bloqueado hasta que lo desbloquees.`,
      confirmLabel: 'Cancelar eliminación',
    })
    if (!ok) return
    await adminApi.cancelDriverPendingDeletion(driver.driverId)
    load()
  }

  const deleteForever = async (driver) => {
    const ok = await confirm({
      title: 'Eliminar definitivamente',
      message: `Esta acción no se puede deshacer: se eliminarán los datos personales de ${driver.name} (nombre, teléfono, correo, foto, cuenta bancaria, domicilio). Sus viajes y cobros se conservan sin datos que lo identifiquen, por obligación legal.`,
      danger: true,
      confirmLabel: 'Eliminar para siempre',
    })
    if (!ok) return
    setError('')
    try {
      await adminApi.deleteDriverPermanently(driver.driverId)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      {!showCreate && error && <AlertBox>{error}</AlertBox>}
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
            <div className="flex flex-col items-end gap-1">
              {d.active !== undefined ? (
                <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Activo' : 'Bloqueado'}</Badge>
              ) : (
                <Badge tone={d.onTrip ? 'info' : 'success'}>{d.onTrip ? 'En viaje' : 'En línea'}</Badge>
              )}
              {d.pendingAmount !== undefined &&
                (Number(d.pendingAmount) > 0 ? (
                  <Badge tone={d.paymentBlocked ? 'danger' : 'warning'}>
                    ${d.pendingAmount} {d.paymentBlocked ? 'bloqueado' : 'pendiente'}
                  </Badge>
                ) : (
                  <Badge tone="success">Al corriente</Badge>
                ))}
            </div>
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
        <StatCard
          icon={CreditCard}
          label="Pagos pendientes"
          value={drivers.filter((d) => Number(d.pendingAmount) > 0).length}
          tone="danger"
          onClick={() => setListModal({ title: 'Pagos pendientes', items: drivers.filter((d) => Number(d.pendingAmount) > 0) })}
        />
        {drivers.some((d) => d.pendingDeletion) && (
          <StatCard
            icon={Trash2}
            label="Solicitudes de eliminación"
            value={drivers.filter((d) => d.pendingDeletion).length}
            tone="danger"
            onClick={() => setListModal({ title: 'Pendientes de eliminación', items: drivers.filter((d) => d.pendingDeletion) })}
          />
        )}
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode('all')}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            viewMode === 'all' ? 'bg-night-900 text-white' : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setViewMode('pending-payment')}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            viewMode === 'pending-payment' ? 'bg-night-900 text-white' : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
        >
          Pendientes de pago {pendingPaymentDrivers.length > 0 && `(${pendingPaymentDrivers.length})`}
        </button>
      </div>

      {viewMode === 'pending-payment' ? (
        <Card padded={false}>
          <CardHeader
            className="px-5 pt-5"
            title="Pendientes de pago"
            subtitle="De mayor a menor saldo · toca uno para ver el detalle"
          />
          {pendingPaymentDrivers.length === 0 ? (
            <div className="px-5 pb-5 pt-3">
              <EmptyState icon={CreditCard} title="Nadie debe saldo" description="Todos los operadores están al corriente con sus pagos." />
            </div>
          ) : (
            pendingPaymentDrivers.map((d) => (
              <ListRow
                key={d.driverId}
                onClick={() => openDetail(d.driverId)}
                avatar={<Avatar url={d.photoUrl} fallback={d.name.charAt(0)} />}
                title={d.name}
                subtitle={
                  <>
                    {d.phone} · {d.unpaidTripCount} viaje{d.unpaidTripCount === 1 ? '' : 's'} sin pagar
                    {d.paymentDueAt && ` · vence ${new Date(d.paymentDueAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`}
                  </>
                }
                right={
                  <>
                    <Badge tone={d.paymentBlocked ? 'danger' : 'warning'}>${d.pendingAmount} MXN</Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkPaidInList(d)
                      }}
                      className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    >
                      Confirmar pago
                    </button>
                    <RowActions active={d.active} pendingDeletion={false} onToggleActive={() => toggleActive(d)} hideDelete />
                  </>
                }
              />
            ))
          )}
        </Card>
      ) : (
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
                className={lowRated ? 'border-l-4 border-l-red-400 bg-red-50/60 dark:bg-red-500/10' : ''}
                avatar={<Avatar url={d.photoUrl} fallback={d.name.charAt(0)} />}
                title={d.name}
                subtitle={
                  <>
                    {d.phone} ·{' '}
                    <span className={lowRated ? 'font-semibold text-red-600' : ''}>
                      {d.ratingAvg}★ ({d.ratingCount})
                    </span>
                    {!d.active && d.deactivationReason && (
                      <>
                        {' · '}
                        <span className="font-medium text-red-600">Motivo: {d.deactivationReason}</span>
                      </>
                    )}
                  </>
                }
                right={
                  <>
                    {rank !== -1 && (
                      <Badge tone="brand" icon={Trophy}>
                        Top {rank + 1}
                      </Badge>
                    )}
                    <Badge tone={d.pendingDeletion ? 'danger' : d.active ? 'success' : 'neutral'}>
                      {d.pendingDeletion ? 'Pend. eliminación' : d.active ? 'Activo' : 'Bloqueado'}
                    </Badge>
                    <RowActions
                      active={d.active}
                      pendingDeletion={d.pendingDeletion}
                      onEdit={() => openDetail(d.driverId)}
                      onToggleActive={() => toggleActive(d)}
                      onRequestDelete={() => requestDelete(d)}
                      onCancelDelete={() => cancelDelete(d)}
                      onDeleteForever={() => deleteForever(d)}
                    />
                  </>
                }
              />
            )
          })
        )}
      </Card>
      )}
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
  const [markingPaid, setMarkingPaid] = useState(false)
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
    const ok = await confirm({ title: 'Guardar cambios', message: `Se actualizarán los datos de ${form.name}. ¿Continuar?`, confirmLabel: 'Guardar' })
    if (!ok) return
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

  const handleMarkPaid = async () => {
    const ok = await confirm({
      title: 'Confirmar pago recibido',
      message: `Se marcará el saldo de ${driver.name} ($${driver.pendingAmount} MXN) como pagado y recuperará acceso para conectarse. ¿Continuar?`,
      confirmLabel: 'Confirmar pago',
    })
    if (!ok) return
    setMarkingPaid(true)
    try {
      await adminApi.markDriverPaid(driverId)
      await loadDriver()
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo confirmar el pago')
    } finally {
      setMarkingPaid(false)
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
        <div className="mb-4 space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs dark:border-brand-500/30 dark:bg-brand-500/10">
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
      {Number(driver.pendingAmount) > 0 && (
        <div
          className={`mb-4 rounded-xl border p-3 text-xs ${
            driver.paymentBlocked
              ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
              : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink-900">
              Saldo pendiente:{' '}
              <span className={driver.paymentBlocked ? 'text-red-700 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}>
                ${driver.pendingAmount} MXN
              </span>
            </p>
            {driver.paymentBlocked && <Badge tone="danger">Bloqueado</Badge>}
          </div>
          <p className="mt-1 text-ink-500">
            {driver.unpaidTripCount} viajes sin pagar
            {driver.paymentDueAt && ` · vence ${new Date(driver.paymentDueAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`}
          </p>
          <Button variant="brand" size="sm" className="mt-2 w-full" loading={markingPaid} onClick={handleMarkPaid}>
            Confirmar pago recibido
          </Button>
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <PhotoPicker value={photo} onChange={setPhoto} existingUrl={photoSrc(driver.photoUrl)} />
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
            driver.ratingCount > 0 && driver.ratingAvg < 4.3
              ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              : 'bg-ink-50 text-ink-600'
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          {driver.ratingAvg} de calificación promedio ({driver.ratingCount} viajes calificados) · ver comentarios
        </button>
        {tripsToday !== null && tripsToday !== undefined && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
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
  const [form, setForm] = useState({ unitNumber: '', plates: '', brand: '', model: '', wheelchairAccessible: false })
  const [showCreate, setShowCreate] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [listModal, setListModal] = useState(null)
  const [allDrivers, setAllDrivers] = useState([])
  const { confirm, ConfirmDialogElement } = useConfirm()

  const load = () => adminApi.listTaxis().then(({ data }) => setAllTaxis(data.data))
  const loadDrivers = () => adminApi.listDrivers().then(({ data }) => setAllDrivers(data.data))
  useEffect(() => {
    load()
    loadDrivers()
    // Un taxi puede darse de alta (autoregistro de operador) mientras esta pestaña ya esta
    // abierta - sin este polling, no se veria hasta cambiar de pestaña o recargar la pagina.
    const interval = setInterval(() => {
      load()
      loadDrivers()
    }, LIVE_MAP_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  const taxis = isSuperAdmin && orgId ? allTaxis.filter((t) => t.organizationId === orgId) : allTaxis

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
      setForm({ unitNumber: '', plates: '', brand: '', model: '', wheelchairAccessible: false })
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
    if (taxi.active) {
      const reason = await confirm({
        title: 'Bloquear taxi',
        message: `La unidad ${taxi.unitNumber} dejará de poder recibir viajes y turnos. El motivo se le mostrará al operador asignado.`,
        danger: true,
        confirmLabel: 'Bloquear',
        requireInput: true,
        inputLabel: 'Motivo (se le mostrará al operador asignado)',
        inputPlaceholder: 'Ej. Mantenimiento, verificación vencida, etc.',
      })
      if (reason === null) return
      await adminApi.setTaxiActive(taxi.id, false, reason)
      load()
      return
    }
    const ok = await confirm({
      title: 'Desbloquear taxi',
      message: `La unidad ${taxi.unitNumber} podrá volver a recibir viajes y turnos. ¿Continuar?`,
      confirmLabel: 'Desbloquear',
    })
    if (!ok) return
    await adminApi.setTaxiActive(taxi.id, true)
    load()
  }

  const requestDelete = async (taxi) => {
    const reason = await confirm({
      title: 'Eliminar taxi',
      message: `La unidad ${taxi.unitNumber} quedará bloqueada y marcada como pendiente de eliminación para que la revises antes de borrarla de forma definitiva.`,
      danger: true,
      confirmLabel: 'Marcar para eliminar',
      requireInput: true,
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ej. Unidad dada de baja de la flotilla, duplicada, etc.',
    })
    if (reason === null) return
    await adminApi.markTaxiPendingDeletion(taxi.id, reason)
    load()
  }

  const cancelDelete = async (taxi) => {
    const ok = await confirm({
      title: 'Cancelar eliminación',
      message: `Se quitará la unidad ${taxi.unitNumber} de la lista de pendientes de eliminación. Seguirá bloqueada hasta que la desbloquees.`,
      confirmLabel: 'Cancelar eliminación',
    })
    if (!ok) return
    await adminApi.cancelTaxiPendingDeletion(taxi.id)
    load()
  }

  const deleteForever = async (taxi) => {
    const ok = await confirm({
      title: 'Eliminar definitivamente',
      message: `Esta acción no se puede deshacer: se borrarán de forma permanente los datos de la unidad ${taxi.unitNumber}. Si tiene operadores vinculados, viajes u otros registros asociados, la eliminación se rechazará y seguirá pendiente.`,
      danger: true,
      confirmLabel: 'Eliminar para siempre',
    })
    if (!ok) return
    setError('')
    try {
      await adminApi.deleteTaxiPermanently(taxi.id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      {!showCreate && error && <AlertBox>{error}</AlertBox>}
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
              <p className="truncate text-xs text-ink-500">
                {t.plates}
                {isSuperAdmin && !orgId && t.organizationName && ` · ${t.organizationName}`}
              </p>
            </div>
            <Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Activo' : 'Bloqueado'}</Badge>
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
        {taxis.some((t) => t.pendingDeletion) && (
          <StatCard
            icon={Trash2}
            label="Solicitudes de eliminación"
            value={taxis.filter((t) => t.pendingDeletion).length}
            tone="danger"
            onClick={() => setListModal({ title: 'Pendientes de eliminación', items: taxis.filter((t) => t.pendingDeletion) })}
          />
        )}
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
          <Switch
            label="Accesible para silla de ruedas"
            checked={form.wheelchairAccessible}
            onChange={(v) => setForm((f) => ({ ...f, wheelchairAccessible: v }))}
          />
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
                    {isSuperAdmin && !orgId && t.organizationName && ` · ${t.organizationName}`}
                    <br />
                    <span className={taxiDrivers.length === 0 ? 'text-ink-400' : ''}>{operatorsLabel}</span>
                    {!t.active && t.deactivationReason && (
                      <>
                        <br />
                        <span className="font-medium text-red-600">Motivo: {t.deactivationReason}</span>
                      </>
                    )}
                  </>
                }
                right={
                  <>
                    <Badge tone={t.pendingDeletion ? 'danger' : t.active ? 'success' : 'neutral'}>
                      {t.pendingDeletion ? 'Pend. eliminación' : t.active ? 'Activo' : 'Bloqueado'}
                    </Badge>
                    <RowActions
                      active={t.active}
                      pendingDeletion={t.pendingDeletion}
                      onEdit={() => setDetailId(t.id)}
                      onToggleActive={() => toggleActive(t)}
                      onRequestDelete={() => requestDelete(t)}
                      onCancelDelete={() => cancelDelete(t)}
                      onDeleteForever={() => deleteForever(t)}
                    />
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

function TaxiDetailModal({ taxiId, onClose, onSaved }) {
  const [taxi, setTaxi] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { confirm, ConfirmDialogElement } = useConfirm()

  useEffect(() => {
    adminApi.getTaxi(taxiId).then(({ data }) => {
      setTaxi(data.data)
      setForm({
        unitNumber: data.data.unitNumber,
        plates: data.data.plates,
        brand: data.data.brand || '',
        model: data.data.model || '',
        wheelchairAccessible: data.data.wheelchairAccessible || false,
      })
    })
    adminApi.listDrivers().then(({ data }) => setDrivers(data.data.filter((d) => d.taxiId === taxiId)))
  }, [taxiId])

  const handleSave = async (e) => {
    e.preventDefault()
    const ok = await confirm({ title: 'Guardar cambios', message: `Se actualizarán los datos de la unidad ${form.unitNumber}. ¿Continuar?`, confirmLabel: 'Guardar' })
    if (!ok) return
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
      <ConfirmDialogElement />
      <form onSubmit={handleSave} className="space-y-4">
        <PhotoPicker value={photo} onChange={setPhoto} existingUrl={photoSrc(taxi.photoUrl)} rounded="rounded-xl" />
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
        <Switch
          label="Accesible para silla de ruedas"
          checked={form.wheelchairAccessible}
          onChange={(v) => setForm((f) => ({ ...f, wheelchairAccessible: v }))}
        />
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
                <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Activo' : 'Bloqueado'}</Badge>
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

/* ------------------------------- Reportes ---------------------------------- */

const REPORT_CATEGORY_LABEL = {
  COBRO_INCORRECTO: 'Cobro incorrecto',
  SEGURIDAD: 'Seguridad',
  MAL_TRATO: 'Mal trato',
  OTRO: 'Otro',
}

const REPORT_ROLE_LABEL = {
  PASSENGER: 'Pasajero',
  DRIVER: 'Operador',
}

function ReportPersonCard({ title, person }) {
  if (!person) return null
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
      <div className="flex items-center gap-3">
        <Avatar url={photoSrc(person.photoUrl)} icon={UserRound} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">{person.name}</p>
          <p className="flex items-center gap-1 text-xs text-ink-500">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {person.ratingAvg ?? '—'} ({person.ratingCount ?? 0})
          </p>
        </div>
      </div>
      <div className="mt-2 space-y-1 text-xs text-ink-600">
        <p className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" /> {person.phone}
        </p>
        {person.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" /> {person.email}
          </p>
        )}
        {person.taxiUnitNumber && (
          <p className="flex items-center gap-2">
            <Car className="h-3.5 w-3.5 shrink-0 text-ink-400" /> Unidad {person.taxiUnitNumber} ({person.taxiPlates})
          </p>
        )}
      </div>
    </div>
  )
}

function TripReportDetailModal({ report, onClose, onResolved }) {
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { confirm, ConfirmDialogElement } = useConfirm()

  const handleResolve = async () => {
    const ok = await confirm({
      title: 'Marcar reporte como resuelto',
      message: 'Se notificará por correo al pasajero y al operador con tu comentario. ¿Continuar?',
      confirmLabel: 'Marcar resuelto',
    })
    if (!ok) return
    setSaving(true)
    setError('')
    try {
      await adminApi.resolveTripReport(report.id, comment.trim())
      onResolved()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo resolver el reporte')
    } finally {
      setSaving(false)
    }
  }

  const isPending = report.status === 'PENDING'

  return (
    <Modal open onClose={onClose} title={`${REPORT_CATEGORY_LABEL[report.category] || report.category} · Viaje #${report.tripId}`} wide>
      <ConfirmDialogElement />
      <div className="space-y-4">
        <div className="rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Reportado por {REPORT_ROLE_LABEL[report.reporterRole] || report.reporterRole} {report.reporterName}
          </p>
          {report.description}
        </div>

        {report.trip && (
          <div className="space-y-1.5 text-sm text-ink-700">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-600" /> {report.trip.originAddress}
            </p>
            <p className="flex items-center gap-2">
              <Flag className="h-4 w-4 shrink-0 text-red-500" /> {report.trip.destinationAddress}
            </p>
            <p className="text-xs text-ink-500">
              {report.trip.requestedAt && new Date(report.trip.requestedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              {report.trip.estimatedFare != null && ` · $${report.trip.estimatedFare} MXN`}
              {report.trip.status && ` · ${report.trip.status}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReportPersonCard title="Pasajero" person={report.passenger} />
          <ReportPersonCard title="Operador" person={report.driver} />
        </div>

        {isPending ? (
          <div>
            <Label>Comentario de resolución</Label>
            <Textarea
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explica cómo se resolvió este reporte - se le notificará por correo al pasajero y al operador"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <Button
              variant="brand"
              className="mt-3 w-full"
              loading={saving}
              disabled={!comment.trim()}
              onClick={handleResolve}
            >
              Marcar resuelto y notificar a ambos
            </Button>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Resuelto por {report.resolvedByName}
              {report.resolvedAt && ` · ${new Date(report.resolvedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`}
            </p>
            {report.resolutionComment}
          </div>
        )}
      </div>
    </Modal>
  )
}

function TripReportsSection() {
  const [tab, setTab] = useState('PENDING')
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = (status = tab) =>
    adminApi.listTripReports(status).then(({ data }) => setReports(data.data)).catch(() => setError('No se pudieron cargar los reportes'))
  useEffect(() => {
    load(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const isPendingTab = tab === 'PENDING'

  return (
    <div className="space-y-5">
      {selected && (
        <TripReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onResolved={() => {
            setSelected(null)
            load()
          }}
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: 'PENDING', label: 'Pendientes' },
          { value: 'RESOLVED', label: 'Resueltos' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTab(opt.value)}
            className={`flex min-h-10 items-center justify-center rounded-xl border-2 text-sm font-semibold transition ${
              tab === opt.value
                ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300'
                : 'border-ink-100 text-ink-500 hover:border-ink-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <Card padded={false}>
        <CardHeader
          className="px-5 pt-5"
          icon={AlertTriangle}
          title="Reportes de viaje"
          subtitle={`${reports.length} ${isPendingTab ? 'pendientes' : 'resueltos'} · un pasajero u operador los crea desde su viaje`}
        />
        {error && (
          <div className="px-5 pb-3">
            <AlertBox>{error}</AlertBox>
          </div>
        )}
        {reports.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={AlertTriangle}
              title={isPendingTab ? 'Sin reportes pendientes' : 'Sin reportes resueltos todavía'}
              description={isPendingTab ? 'Aquí aparecerán cuando alguien reporte un problema en un viaje.' : 'Aquí aparecerán los reportes ya resueltos.'}
            />
          </div>
        ) : (
          reports.map((r) => (
            <ListRow
              key={r.id}
              onClick={() => setSelected(r)}
              avatar={
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isPendingTab
                      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  }`}
                >
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
              }
              title={`${REPORT_CATEGORY_LABEL[r.category] || r.category} · Viaje #${r.tripId}`}
              subtitle={`${REPORT_ROLE_LABEL[r.reporterRole] || r.reporterRole} ${r.reporterName} · ${r.description}`}
              right={<Badge tone="neutral">Ver detalle</Badge>}
            />
          ))
        )}
      </Card>
    </div>
  )
}

/* ----------------------------- Configuracion -------------------------------- */

function PlatformSettingsSection() {
  const [radius, setRadius] = useState('')
  const [searchRadiusKm, setSearchRadiusKm] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [clabe, setClabe] = useState('')
  const [operatorFeeType, setOperatorFeeType] = useState('FIXED')
  const [operatorFeeValue, setOperatorFeeValue] = useState('0')
  const [passengerFeeType, setPassengerFeeType] = useState('FIXED')
  const [passengerFeeValue, setPassengerFeeValue] = useState('0')
  const [paymentDeadlineHour, setPaymentDeadlineHour] = useState('12')
  const [paymentTripThreshold, setPaymentTripThreshold] = useState('20')
  const [fareRoundToMultipleOf5, setFareRoundToMultipleOf5] = useState(false)
  const [fareRoundToWholePeso, setFareRoundToWholePeso] = useState(false)
  const [referralProgramEnabled, setReferralProgramEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [referrals, setReferrals] = useState(null)
  const { confirm, ConfirmDialogElement } = useConfirm()

  const applySettings = (s) => {
    setRadius(String(s.tripGeofenceRadiusMeters))
    setSearchRadiusKm(String(s.dispatchSearchRadiusKm))
    setRewardDescription(s.referralRewardDescription || '')
    setClabe(s.clabe || '')
    setOperatorFeeType(s.operatorFeeType)
    setOperatorFeeValue(String(s.operatorFeeValue))
    setPassengerFeeType(s.passengerFeeType)
    setPassengerFeeValue(String(s.passengerFeeValue))
    setPaymentDeadlineHour(String(s.paymentDeadlineHour))
    setPaymentTripThreshold(String(s.paymentTripThreshold))
    setFareRoundToMultipleOf5(Boolean(s.fareRoundToMultipleOf5))
    setFareRoundToWholePeso(Boolean(s.fareRoundToWholePeso))
    setReferralProgramEnabled(Boolean(s.referralProgramEnabled))
  }

  useEffect(() => {
    adminApi
      .getPlatformSettings()
      .then(({ data }) => applySettings(data.data))
      .catch(() => setError('No se pudo cargar la configuración'))
      .finally(() => setLoading(false))
    adminApi.listReferrals().then(({ data }) => setReferrals(data.data)).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const ok = await confirm({
      title: 'Guardar configuración',
      message: 'Estos cambios aplican de inmediato a toda la plataforma (geocerca, tarifas, cobros y plazos de pago). ¿Continuar?',
      confirmLabel: 'Guardar',
    })
    if (!ok) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { data } = await adminApi.updatePlatformSettings({
        tripGeofenceRadiusMeters: Number(radius),
        dispatchSearchRadiusKm: Number(searchRadiusKm),
        referralRewardDescription: rewardDescription || null,
        clabe: clabe || null,
        operatorFeeType,
        operatorFeeValue: Number(operatorFeeValue),
        passengerFeeType,
        passengerFeeValue: Number(passengerFeeValue),
        paymentDeadlineHour: Number(paymentDeadlineHour),
        paymentTripThreshold: Number(paymentTripThreshold),
        fareRoundToMultipleOf5,
        fareRoundToWholePeso,
        referralProgramEnabled,
      })
      applySettings(data.data)
      setMessage(data.message || 'Configuración actualizada')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Card>
          <p className="text-sm text-ink-400">Cargando...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader
            icon={SlidersHorizontal}
            title="Radios de operación"
            subtitle="Que tan cerca debe estar el operador del punto de recogida/destino, y hasta donde se le ofrecen viajes"
          />
          <div className="space-y-3">
            <div>
              <Label hint="metros">Radio para iniciar/finalizar viaje</Label>
              <Input
                type="number"
                min={10}
                max={5000}
                required
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
              <p className="mt-1.5 text-[11px] text-ink-400">
                Que tan cerca debe estar el operador del punto de recogida (para iniciar) o del destino (para
                finalizar). Entre 10 y 5000 metros. Aplica a todas las organizaciones.
              </p>
            </div>
            <div>
              <Label hint="km">Radio de búsqueda de operadores</Label>
              <Input
                type="number"
                step="0.5"
                min={0.5}
                max={50}
                required
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(e.target.value)}
              />
              <p className="mt-1.5 text-[11px] text-ink-400">
                A cuantos km se le ofrece un viaje nuevo a un operador en línea, y a cuantos km un pasajero ve taxis
                cercanos en su mapa. Entre 0.5 y 50 km.
              </p>
            </div>
            <div>
              <Switch
                label="Mostrar el programa de referidos a operadores y pasajeros"
                checked={referralProgramEnabled}
                onChange={setReferralProgramEnabled}
              />
              <div className="mt-3">
                <Label hint="opcional">Beneficio por invitar (programa de referidos)</Label>
              </div>
              <Textarea
                rows={2}
                maxLength={300}
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                placeholder="Ej. 1 viaje gratis por cada 3 personas que invites"
                disabled={!referralProgramEnabled}
              />
              <p className="mt-1.5 text-[11px] text-ink-400">
                Se le muestra a pasajeros y operadores junto a su código. No se aplica automáticamente (aún no hay
                billetera/crédito en la app) - el beneficio se otorga manualmente.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={CreditCard}
            title="Cobros y pagos de operadores"
            subtitle="Cuánto se cobra por viaje y cuándo se bloquea a un operador por no pagar"
          />
          <div className="space-y-3">
            <div>
              <Label hint="18 dígitos, opcional">CLABE de la plataforma</Label>
              <Input
                value={clabe}
                onChange={(e) => setClabe(e.target.value.replace(/\D/g, '').slice(0, 18))}
                placeholder="Para que los operadores te transfieran su saldo"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Cobro al operador</Label>
                <div className="flex gap-2">
                  <div className="w-28 shrink-0">
                    <Select value={operatorFeeType} onChange={(e) => setOperatorFeeType(e.target.value)}>
                      <option value="FIXED">$ fijo</option>
                      <option value="PERCENT">%</option>
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={operatorFeeValue}
                      onChange={(e) => setOperatorFeeValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Cobro al pasajero</Label>
                <div className="flex gap-2">
                  <div className="w-28 shrink-0">
                    <Select value={passengerFeeType} onChange={(e) => setPassengerFeeType(e.target.value)}>
                      <option value="FIXED">$ fijo</option>
                      <option value="PERCENT">%</option>
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={passengerFeeValue}
                      onChange={(e) => setPassengerFeeValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-ink-400">
              El cobro al pasajero se le suma a la tarifa automáticamente al pedir un viaje. El operador debe ambos
              cobros a la plataforma por cada viaje que completa (ver "monto por pagar" en su panel).
            </p>
            <Switch
              label="Redondear tarifa al múltiplo de 5 más cercano"
              checked={fareRoundToMultipleOf5}
              onChange={setFareRoundToMultipleOf5}
            />
            <p className="text-[11px] text-ink-400">
              Ej. $42.27 se cobra $40, $43.80 se cobra $45 - para que el pasajero pueda pagar en efectivo sin necesitar
              monedas. Aplica a la tarifa base del viaje, no al cobro de servicio.
            </p>
            <Switch
              label="Redondear centavos al peso más cercano"
              checked={fareRoundToWholePeso}
              onChange={setFareRoundToWholePeso}
            />
            <p className="text-[11px] text-ink-400">
              Ej. $42.50 se cobra $43, $42.49 se cobra $42. Aplica a la tarifa base y a los cobros de servicio (pasajero
              y operador), para que ningún monto tenga centavos. Si el múltiplo de 5 también está activo, la tarifa base
              usa el múltiplo de 5.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label hint="0-23">Hora límite del día siguiente</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  required
                  value={paymentDeadlineHour}
                  onChange={(e) => setPaymentDeadlineHour(e.target.value)}
                />
              </div>
              <div>
                <Label hint="viajes">Máximo sin pagar</Label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={paymentTripThreshold}
                  onChange={(e) => setPaymentTripThreshold(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[11px] text-ink-400">
              Si un operador no paga antes de esa hora del día siguiente a su primer viaje sin pagar, o si acumula ese
              número de viajes sin pagar (lo que pase primero), se bloquea su acceso a conectarse hasta que un admin
              confirme su pago.
            </p>
          </div>
        </Card>

        {error && <AlertBox>{error}</AlertBox>}
        {message && <AlertBox tone="success">{message}</AlertBox>}
        <Button type="submit" variant="brand" loading={saving} className="w-full">
          Guardar
        </Button>
      </form>

      <Card>
        <CardHeader icon={UserPlus} title="Referidos" subtitle="Quién invitó a quién" />
        {!referrals ? (
          <p className="text-sm text-ink-400">Cargando...</p>
        ) : referrals.length === 0 ? (
          <EmptyState icon={Gift} title="Sin referidos todavía" description="Cuando alguien se registre con el código de otro usuario, aparecerá aquí." />
        ) : (
          <div className="space-y-2">
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">
                    {r.referrerName} <span className="font-normal text-ink-400">invitó a</span> {r.referredName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {r.referredPhone} · {r.referredRole === 'DRIVER' ? 'Operador' : 'Pasajero'} ·{' '}
                    {new Date(r.referredAt).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
  const { confirm, ConfirmDialogElement } = useConfirm()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await confirm({
      title: 'Guardar tarifa',
      message: 'Esta tarifa se aplicará a los próximos viajes calculados. ¿Continuar?',
      confirmLabel: 'Guardar',
    })
    if (!ok) return
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
      <ConfirmDialogElement />
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-night-900 text-sm font-bold text-white">
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
              <div className="mt-2 space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs dark:border-brand-500/30 dark:bg-brand-500/10">
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
  const [error, setError] = useState('')
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
    if (p.active) {
      const reason = await confirm({
        title: 'Bloquear usuario',
        message: `${p.name} ya no podrá iniciar sesión ni solicitar viajes. El motivo se le mostrará al intentar entrar.`,
        danger: true,
        confirmLabel: 'Bloquear',
        requireInput: true,
        inputLabel: 'Motivo (se le mostrará al usuario)',
        inputPlaceholder: 'Ej. Reportes reiterados, fraude, etc.',
      })
      if (reason === null) return
      await adminApi.setPassengerActive(p.passengerId, false, reason)
      load()
      return
    }
    const ok = await confirm({
      title: 'Desbloquear usuario',
      message: `${p.name} podrá volver a iniciar sesión y solicitar viajes. ¿Continuar?`,
      confirmLabel: 'Desbloquear',
    })
    if (!ok) return
    await adminApi.setPassengerActive(p.passengerId, true)
    load()
  }

  const requestDelete = async (p) => {
    const reason = await confirm({
      title: 'Eliminar usuario',
      message: `${p.name} quedará bloqueado y marcado como pendiente de eliminación para que lo revises antes de borrarlo de forma definitiva.`,
      danger: true,
      confirmLabel: 'Marcar para eliminar',
      requireInput: true,
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ej. Cuenta duplicada, lo solicitó el usuario, etc.',
    })
    if (reason === null) return
    await adminApi.markPassengerPendingDeletion(p.passengerId, reason)
    load()
  }

  const cancelDelete = async (p) => {
    const ok = await confirm({
      title: 'Cancelar eliminación',
      message: `Se quitará a ${p.name} de la lista de pendientes de eliminación. Seguirá bloqueado hasta que lo desbloquees.`,
      confirmLabel: 'Cancelar eliminación',
    })
    if (!ok) return
    await adminApi.cancelPassengerPendingDeletion(p.passengerId)
    load()
  }

  const deleteForever = async (p) => {
    const ok = await confirm({
      title: 'Eliminar definitivamente',
      message: `Esta acción no se puede deshacer: se eliminarán los datos personales de ${p.name} (nombre, teléfono, correo, foto, lugares guardados, contactos y direcciones exactas de sus viajes). Sus viajes se conservan sin datos que lo identifiquen, por obligación legal.`,
      danger: true,
      confirmLabel: 'Eliminar para siempre',
    })
    if (!ok) return
    setError('')
    try {
      await adminApi.deletePassengerPermanently(p.passengerId)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmDialogElement />
      {error && <AlertBox>{error}</AlertBox>}
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
        {passengers.some((p) => p.pendingDeletion) && (
          <StatCard
            icon={Trash2}
            label="Solicitudes de eliminación"
            value={passengers.filter((p) => p.pendingDeletion).length}
            tone="danger"
            onClick={() => setListModal({ title: 'Pendientes de eliminación', items: passengers.filter((p) => p.pendingDeletion) })}
          />
        )}
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
              subtitle={
                <>
                  {p.phone}
                  {p.email ? ` · ${p.email}` : ''}
                  {p.ratingCount > 0 ? ` · ${p.ratingAvg}★ (${p.ratingCount})` : ''}
                  {!p.active && p.deactivationReason && (
                    <>
                      {' · '}
                      <span className="font-medium text-red-600">Motivo: {p.deactivationReason}</span>
                    </>
                  )}
                </>
              }
              right={
                <>
                  <Badge tone={p.pendingDeletion ? 'danger' : p.active ? 'success' : 'neutral'}>
                    {p.pendingDeletion ? 'Pend. eliminación' : p.active ? 'Activo' : 'Bloqueado'}
                  </Badge>
                  <RowActions
                    active={p.active}
                    pendingDeletion={p.pendingDeletion}
                    onToggleActive={() => toggleActive(p)}
                    onRequestDelete={() => requestDelete(p)}
                    onCancelDelete={() => cancelDelete(p)}
                    onDeleteForever={() => deleteForever(p)}
                  />
                </>
              }
            />
          ))
        )}
      </Card>
    </div>
  )
}

/* ---------------------------- Solicitudes ARCO ----------------------------- */

const ARCO_ROLE_LABEL = { PASSENGER: 'Pasajero', DRIVER: 'Operador' }

const ARCO_TYPE_GUIDE = {
  ACCESS: 'El titular puede descargar sus datos desde la app (Privacidad y mis datos). Confírmaselo en la respuesta o atiende lo que pida en específico.',
  RECTIFICATION: 'Corrige el dato en Operadores o Usuarios (o pide al titular que lo cambie desde su perfil) y describe el cambio en la respuesta.',
  CANCELLATION:
    'Para eliminar la cuenta: márcala como pendiente de eliminación en Usuarios u Operadores y usa "Eliminar definitivamente". Esta solicitud se cerrará sola y se avisará al titular.',
  OPPOSITION: 'Indica a qué finalidad se opone y confirma que se dejó de usar su información para ese fin.',
  REVOKE_CONSENT: 'Si es el consentimiento de promociones, el titular también puede desactivarlo él mismo desde la app.',
  LIMIT_USE: 'Indica qué uso o transferencia se limitó.',
}

function ArcoResolveModal({ request, onClose, onSaved }) {
  const [status, setStatus] = useState('RESOLVED')
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus(request?.status === 'PENDING' ? 'IN_PROGRESS' : 'RESOLVED')
    setResponse(request?.response || '')
    setError('')
  }, [request])

  if (!request) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminApi.resolveArcoRequest(request.id, status, response)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Solicitud ${request.folio}`} subtitle={`${ARCO_TYPE_LABEL[request.type]} · ${request.userName}`} wide>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-700">{request.description}</div>
        <p className="text-xs text-ink-500">
          {ARCO_ROLE_LABEL[request.userRole] || request.userRole} · {request.userPhone}
          {request.userEmail ? ` · ${request.userEmail}` : ''} · recibida el {formatDate(request.createdAt)} · vence el{' '}
          {formatDate(request.dueAt)}
        </p>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
          {ARCO_TYPE_GUIDE[request.type]}
        </div>
        <div>
          <Label>Estatus</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="IN_PROGRESS">En proceso (sin cerrar)</option>
            <option value="RESOLVED">Atendida</option>
            <option value="REJECTED">Rechazada</option>
          </Select>
        </div>
        <div>
          <Label hint={status === 'IN_PROGRESS' ? 'opcional' : 'se envía al titular por correo'}>Respuesta</Label>
          <Textarea
            rows={4}
            maxLength={1000}
            required={status !== 'IN_PROGRESS'}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Explica qué se hizo o por qué no procede la solicitud."
          />
        </div>
        {error && <AlertBox>{error}</AlertBox>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" loading={saving}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ArcoRequestsSection() {
  const [requests, setRequests] = useState([])
  const [view, setView] = useState('OPEN')
  const [selected, setSelected] = useState(null)

  const load = () => adminApi.listArcoRequests().then(({ data }) => setRequests(data.data))
  useEffect(() => {
    load()
  }, [])

  const isOpen = (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS'
  const now = new Date()
  const isOverdue = (r) => isOpen(r) && new Date(r.dueAt) < now
  const isDueSoon = (r) => isOpen(r) && !isOverdue(r) && new Date(r.dueAt) - now < 5 * 24 * 60 * 60 * 1000

  const open = requests.filter(isOpen)
  const closed = requests.filter((r) => !isOpen(r))
  const visible = view === 'OPEN' ? open : closed

  return (
    <div className="space-y-5">
      <ArcoResolveModal
        request={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null)
          load()
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={ShieldCheck} label="Abiertas" value={open.length} tone="brand" onClick={() => setView('OPEN')} />
        <StatCard icon={AlertTriangle} label="Vencidas" value={open.filter(isOverdue).length} tone="danger" onClick={() => setView('OPEN')} />
        <StatCard icon={CheckCircle2} label="Cerradas" value={closed.length} tone="success" onClick={() => setView('CLOSED')} />
      </div>

      <Card padded={false}>
        <CardHeader
          className="px-5 pt-5"
          icon={ShieldCheck}
          title="Solicitudes ARCO"
          subtitle="Derechos sobre datos personales · plazo legal de respuesta: 20 días hábiles"
        />
        <div className="flex gap-2 px-5 pb-3">
          {[
            { value: 'OPEN', label: `Abiertas (${open.length})` },
            { value: 'CLOSED', label: `Cerradas (${closed.length})` },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === opt.value ? 'bg-night-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={ShieldCheck}
              title={view === 'OPEN' ? 'Sin solicitudes abiertas' : 'Sin solicitudes cerradas'}
              description="Aquí aparecen las solicitudes que pasajeros y operadores envían desde Privacidad y mis datos, o al usar Eliminar mi cuenta."
            />
          </div>
        ) : (
          visible.map((r) => (
            <ListRow
              key={r.id}
              onClick={isOpen(r) ? () => setSelected(r) : undefined}
              avatar={
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.05] text-ink-600">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
              }
              title={`${r.folio} · ${ARCO_TYPE_LABEL[r.type]}`}
              subtitle={
                <>
                  {r.userName} ({ARCO_ROLE_LABEL[r.userRole] || r.userRole}) · recibida el {formatDate(r.createdAt)}
                  {isOpen(r) ? (
                    <span className={isOverdue(r) ? 'font-semibold text-red-600' : isDueSoon(r) ? 'font-semibold text-amber-600' : ''}>
                      {' · '}vence el {formatDate(r.dueAt)}
                      {isOverdue(r) ? ' (vencida)' : ''}
                    </span>
                  ) : (
                    ` · cerrada el ${formatDate(r.resolvedAt)}`
                  )}
                  <span className="mt-0.5 block truncate text-ink-400">{r.response && !isOpen(r) ? `Respuesta: ${r.response}` : r.description}</span>
                </>
              }
              right={<Badge tone={ARCO_STATUS[r.status]?.tone}>{ARCO_STATUS[r.status]?.label}</Badge>}
            />
          ))
        )}
      </Card>
    </div>
  )
}