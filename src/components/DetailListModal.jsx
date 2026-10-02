import Modal from './ui/Modal'
import EmptyState from './ui/EmptyState'
import { Inbox } from 'lucide-react'

export default function DetailListModal({ open, onClose, title, subtitle, items, loading, renderItem, emptyMessage, emptyIcon: EmptyIcon = Inbox }) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle ?? (items ? `${items.length} en total` : '')} wide>
      {loading ? (
        <p className="py-8 text-center text-sm text-ink-400">Cargando...</p>
      ) : !items || items.length === 0 ? (
        <EmptyState icon={EmptyIcon} title="Sin resultados" description={emptyMessage || 'No hay nada que mostrar todavía.'} />
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="rounded-xl border border-ink-100 p-3">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
