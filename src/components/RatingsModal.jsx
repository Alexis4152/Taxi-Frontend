import { Star } from 'lucide-react'
import Modal from './ui/Modal'
import EmptyState from './ui/EmptyState'

export default function RatingsModal({ open, onClose, ratings, loading, title = 'Calificaciones recibidas' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={ratings ? `${ratings.length} en total` : ''} wide>
      {loading ? (
        <p className="py-6 text-center text-sm text-ink-400">Cargando...</p>
      ) : !ratings || ratings.length === 0 ? (
        <EmptyState icon={Star} title="Sin calificaciones aún" description="Aquí aparecerán las calificaciones y comentarios recibidos." />
      ) : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {ratings.map((r) => (
            <div key={r.id} className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.score ? 'fill-amber-500 text-amber-500' : 'text-ink-200'}`} />
                  ))}
                </div>
                <span className="text-[11px] text-ink-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink-700">"{r.comment}"</p>}
              <p className="mt-1 text-[11px] text-ink-400">— {r.fromUserName}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
