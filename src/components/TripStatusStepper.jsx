import { Check, Search, Car, Flag } from 'lucide-react'

const STEPS = [
  { key: 'SEARCHING', label: 'Buscando', icon: Search },
  { key: 'ACCEPTED', label: 'Aceptado', icon: Check },
  { key: 'IN_PROGRESS', label: 'En camino', icon: Car },
  { key: 'COMPLETED', label: 'Finalizado', icon: Flag },
]

const ORDER = ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED']

export default function TripStatusStepper({ status }) {
  const currentIndex = ORDER.indexOf(status)

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const active = i === currentIndex
        const reached = i <= currentIndex
        const Icon = step.icon
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  reached
                    ? active
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-ink-200 bg-white text-ink-300'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={`text-[10px] font-medium ${reached ? 'text-ink-700' : 'text-ink-300'}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 mb-4 h-0.5 flex-1 rounded-full ${i < currentIndex ? 'bg-emerald-500' : 'bg-ink-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
