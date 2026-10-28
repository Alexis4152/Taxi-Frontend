import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Switch from './ui/Switch'
import { Label, Select, Textarea } from './ui/Field'
import { useAuth } from '../context/AuthContext'
import * as privacyApi from '../api/privacy'
import { ARCO_TYPES, ARCO_TYPE_LABEL, ARCO_STATUS, formatDate } from '../data/arco'

function Block({ title, description, children }) {
  return (
    <div className="space-y-3 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// Autoservicio de privacidad para pasajeros y operadores: aviso, descarga de datos (acceso),
// preferencias de promociones (oposicion/revocacion) y solicitudes ARCO con folio.
export default function PrivacyCenterModal({ open, onClose }) {
  const { user, setUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [type, setType] = useState('ACCESS')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [savingPref, setSavingPref] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setNotice('')
    privacyApi.listMyArcoRequests().then(({ data }) => setRequests(data.data)).catch(() => {})
  }, [open])

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      const { data } = await privacyApi.downloadMyData()
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mis-datos-nexorataxis-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron descargar tus datos')
    } finally {
      setDownloading(false)
    }
  }

  const handleMarketing = async (value) => {
    setSavingPref(true)
    setError('')
    try {
      await privacyApi.updatePrivacyPreferences(value)
      setUser((u) => ({ ...u, marketingOptIn: value }))
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar tu preferencia')
    } finally {
      setSavingPref(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setNotice('')
    try {
      const { data } = await privacyApi.createArcoRequest({ type, description })
      setRequests((list) => [data.data, ...list])
      setDescription('')
      setNotice(`Solicitud enviada. Tu folio es ${data.data.folio}; te responderemos a más tardar el ${formatDate(data.data.dueAt)}.`)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la solicitud')
    } finally {
      setSending(false)
    }
  }

  const selectedType = ARCO_TYPES.find((t) => t.value === type)

  return (
    <Modal open={open} onClose={onClose} title="Privacidad y mis datos" subtitle="Controla cómo usamos tu información personal" wide>
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <Block title="Aviso de privacidad" description="Qué datos recabamos, para qué y con quién los compartimos.">
          <Link
            to="/privacidad"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            <FileText className="h-3.5 w-3.5" /> Leer el aviso de privacidad
          </Link>
        </Block>

        <Block title="Descargar mis datos" description="Un archivo con tu perfil, viajes, calificaciones, mensajes y solicitudes.">
          <Button variant="outline" size="sm" icon={Download} loading={downloading} onClick={handleDownload}>
            Descargar (JSON)
          </Button>
        </Block>

        <Block title="Preferencias">
          <Switch
            checked={Boolean(user?.marketingOptIn)}
            onChange={(value) => !savingPref && handleMarketing(value)}
            label="Recibir promociones y novedades"
          />
          <p className="text-[11px] text-ink-400">Desactivarlo no afecta tu servicio.</p>
        </Block>

        <Block
          title="Ejercer mis derechos ARCO"
          description="Te responderemos en un máximo de 20 días hábiles. Recibirás un folio para darle seguimiento."
        >
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <Label>Derecho</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {ARCO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              {selectedType && <p className="mt-1 text-[11px] text-ink-400">{selectedType.hint}</p>}
            </div>
            <div>
              <Label hint={`${description.length}/1000`}>Describe tu solicitud</Label>
              <Textarea
                required
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Quiero corregir mi correo, el correcto es..."
              />
            </div>
            {notice && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {notice}
              </div>
            )}
            <Button type="submit" variant="brand" size="sm" icon={Send} loading={sending} disabled={!description.trim()}>
              Enviar solicitud
            </Button>
          </form>
        </Block>

        <Block title="Mis solicitudes">
          {requests.length === 0 ? (
            <p className="text-xs text-ink-400">Aún no has enviado solicitudes.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink-900">
                      {r.folio} · {ARCO_TYPE_LABEL[r.type]}
                    </p>
                    <Badge tone={ARCO_STATUS[r.status]?.tone}>{ARCO_STATUS[r.status]?.label}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">
                    Enviada el {formatDate(r.createdAt)}
                    {r.resolvedAt ? ` · respondida el ${formatDate(r.resolvedAt)}` : ` · respuesta a más tardar el ${formatDate(r.dueAt)}`}
                  </p>
                  {r.response && <p className="mt-2 rounded-lg bg-ink-50 px-2.5 py-2 text-xs text-ink-700">{r.response}</p>}
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>
    </Modal>
  )
}
