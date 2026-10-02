import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { Label, Textarea } from './ui/Field'

export default function CancelTripModal({ open, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('')

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const handleConfirm = async () => {
    await onConfirm(reason.trim() || null)
    setReason('')
  }

  return (
    <Modal open={open} onClose={handleClose} title="¿Seguro que quieres cancelar?" subtitle="Esta acción no se puede deshacer">
      <div className="space-y-3">
        <div>
          <Label hint="opcional">Motivo de la cancelación</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Cuéntanos qué pasó..." rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Seguir viaje
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={busy}>
            Sí, cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
