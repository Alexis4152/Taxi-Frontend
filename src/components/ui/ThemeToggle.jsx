import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

// Selector de tema de 2 opciones (claro / oscuro). Vive dentro del menu de
// usuario en Layout, asi que aparece igual para los 4 roles (pasajero, operador, admin, super
// admin) sin tener que repetirlo en cada pantalla.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-full bg-ink-100 p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          title={label}
          className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-semibold transition-colors ${
            theme === value ? 'bg-surface text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
