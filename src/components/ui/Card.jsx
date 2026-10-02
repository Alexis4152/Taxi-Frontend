export default function Card({ className = '', padded = true, children }) {
  return (
    <div
      className={`rounded-2xl border border-ink-100 bg-white shadow-sm shadow-ink-900/[0.04] transition-shadow duration-200 ${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900/[0.04] text-ink-700">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
