// Ilustraciones simples en SVG (mismo estilo plano del logo: geometrico, paleta ink/brand) para
// rellenar visualmente pantallas de espera/vacias sin depender de imagenes externas.

function WaitingForRide({ className = 'h-32 w-32' }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="80" cy="103" rx="62" ry="8" fill="#14171F" opacity="0.06" />
      <rect x="10" y="60" width="26" height="40" rx="3" fill="#EAECF0" />
      <rect x="42" y="40" width="22" height="60" rx="3" fill="#DDE1E8" />
      <rect x="118" y="52" width="24" height="48" rx="3" fill="#EAECF0" />
      <rect x="16" y="66" width="8" height="8" rx="1.5" fill="#2B84F5" opacity="0.7" />
      <rect x="48" y="48" width="8" height="8" rx="1.5" fill="#2B84F5" opacity="0.7" />
      <g>
        <rect x="55" y="72" width="50" height="22" rx="6" fill="#14171F" />
        <rect x="61" y="63" width="38" height="16" rx="6" fill="#14171F" />
        <rect x="66" y="67" width="10" height="8" rx="1.5" fill="#2B84F5" />
        <rect x="84" y="67" width="10" height="8" rx="1.5" fill="#2B84F5" />
        <circle cx="66" cy="96" r="7" fill="#262C3D" />
        <circle cx="66" cy="96" r="3" fill="#8A94A8" />
        <circle cx="94" cy="96" r="7" fill="#262C3D" />
        <circle cx="94" cy="96" r="3" fill="#8A94A8" />
      </g>
      <circle cx="80" cy="20" r="10" fill="#DBEEFF" />
      <path d="M80 12v4M80 24v4M72 20h4M84 20h4" stroke="#2B84F5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function NoOneOnline({ className = 'h-32 w-32' }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="80" cy="100" rx="58" ry="7" fill="#14171F" opacity="0.05" />
      <circle cx="80" cy="52" r="34" fill="#F6F7F9" stroke="#EAECF0" strokeWidth="2" />
      <circle cx="80" cy="42" r="12" fill="#DDE1E8" />
      <path d="M58 76c0-12 10-18 22-18s22 6 22 18" fill="#DDE1E8" />
      <circle cx="112" cy="30" r="9" fill="#DBEEFF" stroke="#2B84F5" strokeWidth="2" />
      <path d="M108 30h8M112 26v8" stroke="#2B84F5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const VARIANTS = {
  waitingForRide: WaitingForRide,
  noOneOnline: NoOneOnline,
}

export default function Illustration({ name, className }) {
  const Comp = VARIANTS[name]
  if (!Comp) return null
  return <Comp className={className} />
}
