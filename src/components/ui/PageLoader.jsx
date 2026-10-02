import Logo from './Logo'

export default function PageLoader({ label = 'Cargando...' }) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-3">
        <Logo withWordmark={false} size={52} className="animate-bounce [animation-duration:1.4s]" />
        <div className="h-1 w-16 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full w-1/2 rounded-full bg-brand-500 [animation:loader-slide_1.1s_ease-in-out_infinite]" />
        </div>
      </div>
      <p className="text-xs font-medium text-ink-400">{label}</p>
    </div>
  )
}
