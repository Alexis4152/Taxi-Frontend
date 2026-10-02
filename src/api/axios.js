import axios from 'axios'

// Vacio = rutas relativas al origen actual (el proxy de Vite las reenvia al backend en dev; en
// produccion, el backend se sirve desde el mismo dominio o se define VITE_API_URL explicitamente).
const API_URL = import.meta.env.VITE_API_URL || ''

let accessToken = null
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/api/auth/refresh').finally(() => {
            refreshPromise = null
          })
        }
        const { data } = await refreshPromise
        setAccessToken(data.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        setAccessToken(null)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api
