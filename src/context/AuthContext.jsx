import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { setAccessToken } from '../api/axios'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .refreshSession()
      .then(({ data }) => {
        setAccessToken(data.data.accessToken)
        setUser(data.data.user)
      })
      .catch(() => {
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const applyAuthResult = useCallback((authResponse) => {
    setAccessToken(authResponse.accessToken)
    setUser(authResponse.user)
  }, [])

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.registerPassenger(payload)
      applyAuthResult(data.data)
      return data.data.user
    },
    [applyAuthResult]
  )

  const registerDriver = useCallback(
    async (payload) => {
      const { data } = await authApi.registerDriver(payload)
      applyAuthResult(data.data)
      return data.data.user
    },
    [applyAuthResult]
  )

  // Login unico para cualquier rol: el backend determina el tipo de cuenta y sus privilegios a
  // partir de lo que ya esta en base de datos (no se pide elegir "pasajero"/"operador" ni datos
  // extra como el numero de taxi).
  const login = useCallback(
    async (phone, password) => {
      const { data } = await authApi.login({ phone, password })
      applyAuthResult(data.data)
      return data.data.user
    },
    [applyAuthResult]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.fetchMe()
    setUser(data.data)
    return data.data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, register, registerDriver, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
