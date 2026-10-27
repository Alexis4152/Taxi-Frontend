import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'nexora-theme'
const ThemeContext = createContext(null)

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage no disponible (modo privado, etc.) - se usa el valor por defecto
  }
  return 'system'
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
}

// Tema del usuario: 'light' | 'dark' | 'system' (sigue el SO), aplicable en cualquier perfil
// (pasajero, operador, admin, super admin) porque se monta una sola vez a nivel raiz de la app.
// Se guarda en localStorage - cada dispositivo/navegador recuerda su propia preferencia.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  const isDark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark())

  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // si no se puede guardar, el tema igual se aplica para esta sesion
    }
  }

  const value = useMemo(() => ({ theme, isDark, setTheme }), [theme, isDark])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
