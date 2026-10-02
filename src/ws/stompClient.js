import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// Relativo al origen actual por defecto (el proxy de Vite lo reenvia al backend en dev).
const WS_URL = import.meta.env.VITE_WS_URL || '/ws'

let client = null
let connectPromise = null

function getClient() {
  if (!client) {
    client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      debug: () => {},
    })
  }
  return client
}

function ensureConnected() {
  const c = getClient()
  if (c.connected) return Promise.resolve(c)
  if (connectPromise) return connectPromise

  connectPromise = new Promise((resolve, reject) => {
    c.onConnect = () => resolve(c)
    c.onStompError = (frame) => reject(frame)
    c.activate()
  }).finally(() => {
    connectPromise = null
  })
  return connectPromise
}

export async function subscribe(topic, callback) {
  const c = await ensureConnected()
  const subscription = c.subscribe(topic, (message) => {
    try {
      callback(JSON.parse(message.body))
    } catch {
      callback(message.body)
    }
  })
  return () => subscription.unsubscribe()
}
