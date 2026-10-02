import { MapPin, ShieldCheck, Timer, Star } from 'lucide-react'
import Logo from './Logo'

const FEATURES = [
  { icon: MapPin, text: 'Despacho por cercanía en tiempo real' },
  { icon: Timer, text: 'Tarifa estimada antes de confirmar' },
  { icon: ShieldCheck, text: 'Operadores verificados' },
  { icon: Star, text: 'Calificación mutua entre pasajero y operador' },
]

export default function BrandPanel({ eyebrow = 'Tu taxi, sin complicaciones', title, description }) {
  return (
    <div className="relative hidden overflow-hidden bg-ink-950 px-10 py-12 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #2B84F5 0, #2B84F5 14px, transparent 14px, transparent 28px)',
        }}
      />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative">
        <Logo size={40} variant="dark" />
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">{eyebrow}</p>
        <h1 className="mt-3 max-w-sm font-display text-3xl font-extrabold leading-tight">{title}</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-300">{description}</p>
      </div>

      <ul className="relative space-y-4">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-ink-200">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-4.5 w-4.5 text-brand-400" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
