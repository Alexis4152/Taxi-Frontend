import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { Label, Select, Textarea } from './ui/Field'

const CATEGORY_OPTIONS = [
  { value: 'COBRO_INCORRECTO', label: 'Cobro incorrecto' },
  { value: 'SEGURIDAD', label: 'Seguridad' },
  { value: 'MAL_TRATO', label: 'Mal trato' },
  { value: 'OTRO', label: 'Otro' },
]

/**
 * Reutilizado por pasajero y operador: reportar un problema en un viaje especifico (activo o del
 * historial). Un administrador lo revisa despues - este modal solo lo envia.
 */
export default function ReportTripModal({ open, onClose, onSubmit }) {
  const [category, setCategory] = useState('COBRO_INCORRECTO')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const reset = () => {
    setCategory('COBRO_INCORRECTO')
    setDescription('')
    setError('')
    setSent(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit({ category, description: description.trim() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar el reporte')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Reportar un problema" subtitle="Un administrador lo revisará">
      {sent ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-700">Tu reporte fue enviado. Gracias por avisarnos.</p>
          <Button variant="brand" className="w-full" onClick={handleClose}>
            Entendido
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>¿Qué pasó?</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Cuéntanos qué pasó</Label>
            <Textarea
              required
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente el problema..."
            />
          </div>
          {error && <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
          <Button type="submit" variant="brand" className="w-full" loading={busy}>
            Enviar reporte
          </Button>
        </form>
      )}
    </Modal>
  )
}
