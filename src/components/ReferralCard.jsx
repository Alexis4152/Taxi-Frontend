import { useEffect, useState } from 'react'
import { Gift, Share2 } from 'lucide-react'
import { myReferral } from '../api/referrals'
import { getPublicSettings } from '../api/settings'
import Card, { CardHeader } from './ui/Card'

export default function ReferralCard() {
  const [info, setInfo] = useState(null)
  const [copied, setCopied] = useState(false)
  // undefined = cargando todavia (no se sabe si mostrar u ocultar) - se asume oculto hasta
  // confirmar, para no mostrar la tarjeta un instante y luego desaparecerla de golpe.
  const [enabled, setEnabled] = useState(undefined)

  useEffect(() => {
    myReferral().then(({ data }) => setInfo(data.data)).catch(() => {})
    getPublicSettings()
      .then(({ data }) => setEnabled(data.data.referralProgramEnabled))
      .catch(() => setEnabled(true))
  }, [])

  if (!info || !enabled) return null

  const handleShare = async () => {
    const link = `${window.location.origin}/register?ref=${info.code}`
    const text = `Únete a NexoraTaxis con mi código ${info.code} y pide tu taxi en minutos.\n${link}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NexoraTaxis', text })
      } catch {
        // Dialogo nativo cancelado, no es un error.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Sin permiso de portapapeles: se ignora, el codigo ya esta visible para copiar a mano.
    }
  }

  return (
    <Card>
      <CardHeader icon={Gift} title="Invita y gana" subtitle={info.rewardDescription || 'Comparte tu código con otras personas'} />
      <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
        <span className="text-lg font-bold tracking-[0.25em] text-ink-900">{info.code}</span>
        <button
          type="button"
          onClick={handleShare}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-night-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-night-700"
        >
          <Share2 className="h-3.5 w-3.5" /> {copied ? 'Copiado' : 'Compartir'}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {info.referralCount} {info.referralCount === 1 ? 'persona ya se registró' : 'personas ya se registraron'} con tu código.
      </p>
    </Card>
  )
}
