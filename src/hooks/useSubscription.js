import { useEffect, useRef } from 'react'
import { subscribe } from '../ws/stompClient'

export function useSubscription(topic, onMessage, enabled = true) {
  const callbackRef = useRef(onMessage)
  callbackRef.current = onMessage

  useEffect(() => {
    if (!enabled || !topic) return undefined
    let unsubscribe = null
    let cancelled = false

    subscribe(topic, (payload) => callbackRef.current(payload)).then((unsub) => {
      if (cancelled) {
        unsub()
      } else {
        unsubscribe = unsub
      }
    })

    return () => {
      cancelled = true
      if (unsubscribe) unsubscribe()
    }
  }, [topic, enabled])
}
