import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, subtitle, children, wide = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 sm:items-center sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl ${
          wide ? 'sm:max-w-lg' : 'sm:max-w-sm'
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
