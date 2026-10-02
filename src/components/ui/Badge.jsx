const TONES = {
  neutral: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-900/[0.04]',
  brand: 'bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-900/[0.06]',
  success: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-900/[0.06]',
  warning: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-900/[0.06]',
  danger: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-900/[0.06]',
  info: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-900/[0.06]',
}

export default function Badge({ tone = 'neutral', icon: Icon, dot = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}
