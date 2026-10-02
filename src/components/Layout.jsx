import { useState } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './ui/Logo'

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  DRIVER: 'Operador',
  PASSENGER: 'Pasajero',
}

const ROLE_TONES = {
  SUPER_ADMIN: 'bg-ink-900 text-white',
  ADMIN: 'bg-blue-100 text-blue-700',
  DRIVER: 'bg-brand-100 text-brand-800',
  PASSENGER: 'bg-emerald-100 text-emerald-700',
}

// El pasajero, el super admin y el operador ven siempre la marca de la plataforma; solo el admin
// de una organizacion contratante ve el logo y nombre de SU organizacion (el sistema es de "marca
// blanca" para el, aunque por dentro sea la misma plataforma multi-organizacion) - al operador no
// le corresponde administrar esa marca, solo trabajar dentro de la app.
function OrgBrand({ user }) {
  const [logoBroken, setLogoBroken] = useState(false)
  const showOrgBrand = user && user.role === 'ADMIN' && user.organizationName

  if (!showOrgBrand) {
    return <Logo />
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {user.organizationLogoUrl && !logoBroken ? (
        <img
          src={`${import.meta.env.VITE_API_URL || ''}${user.organizationLogoUrl}`}
          alt=""
          onError={() => setLogoBroken(true)}
          className="h-9 w-9 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white">
          {user.organizationName.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold text-ink-900">{user.organizationName}</p>
        <p className="text-[10px] text-ink-400">con NexoraTaxis</p>
      </div>
    </div>
  )
}

export default function Layout({ title, subtitle, sidebar, wide = false, bottomBar, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="safe-top sticky top-0 z-20 border-b border-ink-100 bg-white/85 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 ${wide ? 'max-w-7xl' : 'max-w-3xl'}`}>
          <div className="flex min-w-0 items-center gap-4">
            <OrgBrand user={user} />
            {title && (
              <div className="hidden min-w-0 border-l border-ink-200 pl-4 sm:block">
                <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
                {subtitle && <p className="truncate text-xs text-ink-400">{subtitle}</p>}
              </div>
            )}
          </div>

          {user && (
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-ink-100 py-1 pl-1 pr-2 hover:bg-ink-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight text-ink-800">{user.name}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lg shadow-ink-900/10">
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="text-sm font-semibold text-ink-900">{user.name}</p>
                      <p className="text-xs text-ink-400">{user.phone}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_TONES[user.role]}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className={`mx-auto px-4 py-6 sm:px-6 ${wide ? 'max-w-7xl' : 'max-w-3xl'} ${bottomBar ? 'pb-28' : ''}`}>
        {sidebar ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            <aside className="lg:w-60 lg:shrink-0">{sidebar}</aside>
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </div>

      {bottomBar && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className={`mx-auto ${wide ? 'max-w-7xl' : 'max-w-3xl'}`}>{bottomBar}</div>
        </div>
      )}
    </div>
  )
}
