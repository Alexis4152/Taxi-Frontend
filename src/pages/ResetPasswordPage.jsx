import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import BrandPanel from '../components/ui/BrandPanel'
import Logo from '../components/ui/Logo'
import { Label, Input } from '../components/ui/Field'
import Button from '../components/ui/Button'
import * as authApi from '../api/auth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <BrandPanel title="Elige una nueva contraseña" description="Tu enlace de recuperación es válido por 30 minutos y solo se puede usar una vez." />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          {!token ? (
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-900">Enlace inválido</h2>
              <p className="mb-6 mt-1 text-sm text-ink-500">
                Este enlace no incluye un código de recuperación. Solicita uno nuevo desde la pantalla de inicio de sesión.
              </p>
              <Link to="/forgot-password" className="text-sm font-semibold text-ink-900 hover:underline">
                Solicitar enlace de recuperación
              </Link>
            </div>
          ) : done ? (
            <div className="text-center sm:text-left">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:mx-0">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="font-display mt-4 text-2xl font-bold text-ink-900">Contraseña actualizada</h2>
              <p className="mt-1 text-sm text-ink-500">Ya puedes iniciar sesión con tu nueva contraseña. Te llevaremos al login en unos segundos...</p>
              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-900 hover:underline sm:justify-start">
                <ArrowLeft className="h-4 w-4" /> Ir a iniciar sesión ahora
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-ink-900">Nueva contraseña</h2>
              <p className="mb-6 mt-1 text-sm text-ink-500">Elige una contraseña de al menos 8 caracteres.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nueva contraseña</Label>
                  <Input icon={Lock} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <Label>Confirmar contraseña</Label>
                  <Input icon={Lock} type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
