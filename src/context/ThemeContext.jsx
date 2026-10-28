import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'nexora-theme'
const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    // Un 'system' guardado de versiones anteriores cae al default (claro)
    if (localStorage.getItem(STORAGE_KEY) === 'dark') return 'dark'
  } catch {
    // localStorage no disponible (modo privado, etc.) - se usa el valor por defecto
  }
  return 'light'
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
}

// Tema del usuario: 'light' | 'dark', aplicable en cualquier perfil
// (pasajero, operador, admin, super admin) porque se monta una sola vez a nivel raiz de la app.
// Se guarda en localStorage - cada dispositivo/navegador recuerda su propia preferencia.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  const isDark = theme === 'dark'

  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

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
