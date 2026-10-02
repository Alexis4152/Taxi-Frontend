import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'

export default function ChatPanel({ open, onClose, messages, onSend, sending, currentUserId, title, quickReplies = [] }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [open, messages.length])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const body = text
    setText('')
    await onSend(body)
  }

  const handleQuickReply = async (body) => {
    if (sending) return
    await onSend(body)
  }

  return (
    <Modal open={open} onClose={onClose} title={title || 'Chat'} subtitle="Mensajes de este viaje">
      <div className="flex h-[55vh] flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {messages.length === 0 && <p className="py-8 text-center text-xs text-ink-400">Aún no hay mensajes. Escribe el primero.</p>}
          {messages.map((m) => {
            const mine = m.senderUserId === currentUserId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-800'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-white/70' : 'text-ink-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        {quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuickReply(q)}
                disabled={sending}
                className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600 transition-colors hover:border-brand-500 hover:text-ink-900 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full border border-ink-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
          <Button type="submit" variant="brand" size="md" icon={Send} loading={sending} disabled={!text.trim()} />
        </form>
      </div>
    </Modal>
  )
}
