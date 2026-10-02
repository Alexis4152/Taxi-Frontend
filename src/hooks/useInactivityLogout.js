import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']

/**
 * Cierra la sesion sola si el usuario no interactua con la pantalla durante `minutes` minutos.
 * Pensado para el rol de pasajero: un operador o admin puede dejar la pantalla abierta mientras
 * trabaja sin tocarla (esperando viajes), pero un pasajero que abandona la app deberia perder la
 * sesion por seguridad tras un rato de inactividad real.
 */
export function useInactivityLogout(enabled, minutes, onTimeout) {
  const timerRef = useRef(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!enabled) return undefined

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onTimeoutRef.current(), minutes * 60 * 1000)
    }

    reset()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [enabled, minutes])
}
