import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import Button from './ui/Button'
import { useAuth } from '../context/AuthContext'
import * as privacyApi from '../api/privacy'

// Las cuentas creadas antes de que existiera el aviso de privacidad (o cuando se actualice) no lo
// han aceptado: se les pide aceptarlo antes de seguir usando la app. Solo aplica a pasajeros y
// operadores (titulares); el personal administrativo no pasa por aqui.
export default function PrivacyConsentGate() {
  const { user, setUser, logout } = useAuth()
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const applies = user && ['PASSENGER', 'DRIVER'].includes(user.role) && !user.privacyAcceptedAt
  if (!applies) return null

  const handleAccept = async () => {
    setSaving(true)
    setError('')
    try {
      await privacyApi.acceptPrivacyNotice(marketingOptIn)
      setUser((u) => ({ ...u, privacyAcceptedAt: new Date().toISOString(), marketingOptIn }))
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar tu aceptación')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-night-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h3 className="text-base font-semibold text-ink-900">Actualizamos nuestro aviso de privacidad</h3>
        <p className="mt-1.5 text-sm text-ink-600">
          Para seguir usando NexoraTaxis, revisa cómo tratamos tus datos personales y cómo puedes ejercer tus derechos ARCO.
        </p>
        <Link
          to="/privacidad"
          target="_blank"
          className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Leer el aviso de privacidad
        </Link>

        <label className="mt-4 flex items-start gap-2 text-xs text-ink-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
          />
          <span>Quiero recibir promociones y novedades (opcional).</span>
        </label>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={logout} disabled={saving}>
            Salir
          </Button>
          <Button variant="brand" className="flex-1" loading={saving} onClick={handleAccept}>
            Acepto
          </Button>
        </div>
      </div>
    </div>
  )
}
