export function Label({ children, hint }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className="block text-xs font-semibold text-ink-600">{children}</label>
      {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
    </div>
  )
}

export function Input({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />}
      <input
        className={`w-full rounded-xl border border-ink-200 bg-white py-2.5 text-base text-ink-900 placeholder:text-ink-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ${
          Icon ? 'pl-10 pr-3' : 'px-3'
        } ${className}`}
        {...props}
      />
    </div>
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-base text-ink-900 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-base text-ink-900 placeholder:text-ink-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ${className}`}
      {...props}
    />
  )
}
