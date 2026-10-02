import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Phone, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandPanel from '../components/ui/BrandPanel'
import Logo from '../components/ui/Logo'
import { Label, Input } from '../components/ui/Field'
import Button from '../components/ui/Button'

const ROLE_HOME = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  DRIVER: '/driver',
  PASSENGER: '/',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updatePhone = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(phone, password)
      navigate(ROLE_HOME[user.role] || '/', { state: { justLoggedIn: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <BrandPanel
        title="Pide un taxi en minutos, a donde quieras ir"
        description="Comparte tu ubicación, elige tu destino y ve llegar a tu operador en tiempo real, con la tarifa clara antes de confirmar."
      />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-900">Bienvenido de nuevo</h2>
          <p className="mb-6 mt-1 text-sm text-ink-500">Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Teléfono</Label>
              <Input
                icon={Phone}
                type="tel"
                inputMode="numeric"
                required
                minLength={10}
                maxLength={10}
                value={phone}
                onChange={updatePhone}
                placeholder="10 dígitos"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className="block text-xs font-semibold text-ink-600">Contraseña</label>
                <Link to="/forgot-password" className="text-[11px] font-medium text-ink-500 hover:text-ink-900 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input icon={Lock} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {location.state?.registered && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Tu cuenta fue creada. Inicia sesión para continuar.
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-ink-900 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
