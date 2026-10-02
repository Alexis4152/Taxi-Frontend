export default function StatCard({ icon: Icon, label, value, tone = 'ink', onClick }) {
  const tones = {
    ink: 'bg-ink-900/[0.04] text-ink-700',
    brand: 'bg-brand-100 text-brand-800',
    success: 'bg-emerald-100 text-emerald-700',
    info: 'bg-blue-100 text-blue-700',
  }
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 text-left shadow-sm shadow-ink-900/[0.04] transition-transform duration-200 hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
        <p className="mt-1 text-xs text-ink-500">{label}</p>
      </div>
    </Tag>
  )
}
