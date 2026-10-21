import { useState } from 'react'

// Notificaciones nativas del navegador (Notification API), sin Service Worker ni push real del
// servidor: el WS solo funciona mientras la pestaña sigue abierta (ver stompClient.js), asi que no
// tiene sentido montar infraestructura de push "real" (que sobreviviria con la app cerrada) si de
// todas formas no se puede recibir el evento sin la pestaña abierta. Esto cubre el caso real: la
// pestaña abierta pero no enfocada (el operador/pasajero esta viendo otra cosa).
export function useBrowserNotifications() {
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'denied'))

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  const notify = (title, options) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    // No duplica la señal si el usuario ya esta viendo la pestaña: la UI ya le muestra el cambio.
    if (document.visibilityState === 'visible') return
    try {
      const n = new Notification(title, { icon: '/favicon.ico', ...options })
      n.onclick = () => {
        window.focus()
        n.close()
      }
    } catch {
      // Algunos navegadores (ej. ciertas versiones de Safari/iOS) no soportan el constructor
      // aunque el permiso este concedido; se ignora en vez de romper el flujo de la app.
    }
  }

  return { permission, requestPermission, notify }
}
