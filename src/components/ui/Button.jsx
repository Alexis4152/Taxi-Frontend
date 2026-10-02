import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-ink-900 text-white shadow-sm shadow-ink-900/20 hover:bg-ink-800 focus-visible:outline-ink-900 disabled:bg-ink-300 disabled:shadow-none',
  brand: 'bg-brand-500 text-white shadow-sm shadow-brand-500/30 hover:bg-brand-600 focus-visible:outline-brand-600 disabled:bg-brand-200 disabled:text-ink-400 disabled:shadow-none',
  outline: 'border border-ink-200 text-ink-700 hover:bg-ink-50 focus-visible:outline-ink-300 disabled:text-ink-300',
  ghost: 'text-ink-600 hover:bg-ink-100 focus-visible:outline-ink-300',
  danger: 'border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline-red-300',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500 focus-visible:outline-emerald-600 disabled:bg-emerald-200 disabled:shadow-none',
}

// Alturas alineadas a los minimos de "tap target" recomendados (~44px iOS / 48dp Android),
// para que sean comodos de tocar con el pulgar en un telefono.
const SIZES = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-13 px-5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold outline-offset-2 transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}
