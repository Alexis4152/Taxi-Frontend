import { useState } from 'react'
import { Star, AlertCircle } from 'lucide-react'
import { submitRating } from '../api/ratings'
import Card, { CardHeader } from './ui/Card'
import { Textarea } from './ui/Field'
import Button from './ui/Button'

const TIP_OPTIONS = [0, 10, 20, 50]

export default function RatingForm({ tripId, targetLabel, onDone, showTip = false }) {
  const [score, setScore] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [tip, setTip] = useState(0)
  const [customTip, setCustomTip] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const effectiveTip = customTip !== '' ? Number(customTip) || 0 : tip

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await submitRating({ tripId, score, comment: comment || null, tip: showTip ? effectiveTip : undefined })
      onDone(showTip ? effectiveTip : 0)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la calificacion')
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title={`Califica a ${targetLabel}`} subtitle="Tu opinión ayuda a mantener el servicio confiable" />

      <div className="mb-4 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setScore(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                n <= (hover || score) ? 'fill-amber-500 text-amber-500' : 'fill-ink-100 text-ink-200'
              }`}
            />
          </button>
        ))}
      </div>
      {showTip && (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs font-medium text-ink-600">¿Quieres dejar una propina?</p>
          <div className="flex justify-center gap-2">
            {TIP_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setTip(n)
                  setCustomTip('')
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  customTip === '' && tip === n ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {n === 0 ? 'Sin propina' : `$${n}`}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            step="1"
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            placeholder="Otra cantidad"
            className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2 text-center text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
      )}
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentario (opcional)" rows={2} />
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      <Button variant="brand" loading={submitting} onClick={handleSubmit} className="mt-4 w-full">
        Enviar calificación
      </Button>
    </Card>
  )
}
