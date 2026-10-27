export default function StatCard({ icon: Icon, label, value, tone = 'ink', onClick }) {
  const tones = {
    ink: 'bg-ink-900/[0.04] text-ink-700',
    brand: 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  }
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-surface p-4 text-left shadow-sm shadow-ink-900/[0.04] transition-transform duration-200 hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
        <p className="mt-1 text-xs leading-snug text-ink-500">{label}</p>
      </div>
    </Tag>
  )
}
