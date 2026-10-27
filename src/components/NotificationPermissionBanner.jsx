import { useState } from 'react'
import { Bell, X } from 'lucide-react'

const DISMISS_KEY = 'notif-banner-dismissed'

export default function NotificationPermissionBanner({ permission, onRequest }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  if (permission !== 'default' || dismissed) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-ink-800 dark:border-brand-500/30 dark:bg-brand-500/10">
      <Bell className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-400" />
      <p className="flex-1 text-xs">Activa las notificaciones para enterarte aunque no tengas esta pestaña abierta.</p>
      <button
        type="button"
        onClick={async () => {
          await onRequest()
          dismiss()
        }}
        className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
      >
        Activar
      </button>
      <button type="button" onClick={dismiss} aria-label="Cerrar" className="shrink-0 text-ink-400 hover:text-ink-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
