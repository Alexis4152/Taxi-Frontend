import { useCallback, useEffect, useRef, useState } from 'react'
import { getTripMessages, sendTripMessage } from '../api/trips'
import { useSubscription } from './useSubscription'

/**
 * Historial + tiempo real del chat de un viaje. `enabled` debe reflejar si el viaje esta en un
 * estado donde el chat aplica (aceptado o en curso) - el backend rechaza mensajes fuera de eso,
 * esto solo evita pedir/suscribirse quando no tiene caso.
 */
export function useTripChat(tripId, enabled, currentUserId, isOpen = false) {
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [sending, setSending] = useState(false)
  const seenIds = useRef(new Set())
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen

  useEffect(() => {
    seenIds.current = new Set()
    if (!tripId || !enabled) {
      setMessages([])
      setUnreadCount(0)
      return
    }
    getTripMessages(tripId)
      .then(({ data }) => {
        setMessages(data.data)
        data.data.forEach((m) => seenIds.current.add(m.id))
      })
      .catch(() => {})
  }, [tripId, enabled])

  useSubscription(
    enabled && tripId ? `/topic/trip/${tripId}/messages` : null,
    (message) => {
      if (seenIds.current.has(message.id)) return
      seenIds.current.add(message.id)
      setMessages((prev) => [...prev, message])
      if (message.senderUserId !== currentUserId && !isOpenRef.current) {
        setUnreadCount((c) => c + 1)
      }
    },
    Boolean(enabled && tripId)
  )

  const sendMessage = useCallback(
    async (body) => {
      if (!tripId || !body.trim()) return
      setSending(true)
      try {
        await sendTripMessage(tripId, body.trim())
      } finally {
        setSending(false)
      }
    },
    [tripId]
  )

  const markAllRead = useCallback(() => setUnreadCount(0), [])

  return { messages, sendMessage, sending, unreadCount, markAllRead }
}
