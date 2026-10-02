import Illustration from './Illustration'

export default function EmptyState({ icon: Icon, illustration, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-10 text-center">
      {illustration ? (
        <Illustration name={illustration} className="mb-3 h-28 w-28" />
      ) : (
        Icon && (
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-400 shadow-sm">
            <Icon className="h-5.5 w-5.5" />
          </span>
        )
      )}
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-ink-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
