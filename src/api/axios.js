import axios from 'axios'

// Vacio = rutas relativas al origen actual (el proxy de Vite las reenvia al backend en dev; en
// produccion, el backend se sirve desde el mismo dominio o se define VITE_API_URL explicitamente).
const API_URL = import.meta.env.VITE_API_URL || ''

const REFRESH_TOKEN_KEY = 'taxi_refresh_token'

let accessToken = null
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

// sessionStorage (no una cookie): cada pestaña tiene el suyo propio, aislado de las demas, para
// poder tener pasajero/operador/admin en pestañas distintas del mismo navegador sin que una
// sesion pise a la otra. A cambio de ese aislamiento por pestaña, el token ya no esta protegido de
// JavaScript por httpOnly - decision consciente, ver comentario en AuthController del backend.
export function setRefreshToken(token) {
  try {
    if (token) sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
    else sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Navegacion privada o storage bloqueado: la sesion simplemente no sobrevive un refresh,
    // no es un error que deba romper el login.
  }
}

export function getRefreshToken() {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

const api = axios.create({
  baseURL: API_URL,
  // Sin esto, una peticion que se queda colgada (red inestable, servidor caido) deja la pantalla
  // esperando indefinidamente sin ningun aviso, lo cual se ve identico a que la app "no cargo".
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = originalRequest?.url?.startsWith('/api/auth/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      const storedRefreshToken = getRefreshToken()
      if (!storedRefreshToken) {
        setAccessToken(null)
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/api/auth/refresh', { refreshToken: storedRefreshToken }).finally(() => {
            refreshPromise = null
          })
        }
        const { data } = await refreshPromise
        setAccessToken(data.data.accessToken)
        setRefreshToken(data.data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        setAccessToken(null)
        setRefreshToken(null)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api
