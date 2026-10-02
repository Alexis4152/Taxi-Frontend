import { useEffect, useRef, useState } from 'react'
import { LocationStatus, watchPosition } from '../services/locationService'
import { LOCATION_UPDATE_INTERVAL_MS } from '../config'

export function useGeolocation(enabled = true, intervalMs = LOCATION_UPDATE_INTERVAL_MS) {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState(LocationStatus.IDLE)
  const [error, setError] = useState(null)
  const stopRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      stopRef.current?.()
      stopRef.current = null
      return undefined
    }

    stopRef.current = watchPosition({
      intervalMs,
      onPosition: (pos) => {
        setPosition(pos)
        setError(null)
      },
      onStatusChange: (nextStatus, message) => {
        setStatus(nextStatus)
        setError(message || null)
      },
    })

    return () => {
      stopRef.current?.()
      stopRef.current = null
    }
  }, [enabled, intervalMs])

  return { position, status, error }
}
