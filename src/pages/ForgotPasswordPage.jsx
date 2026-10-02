import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import BrandPanel from '../components/ui/BrandPanel'
import Logo from '../components/ui/Logo'
import { Label, Input } from '../components/ui/Field'
import Button from '../components/ui/Button'
import * as authApi from '../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      // Mensaje identico exista o no la cuenta: no revelamos si un correo esta registrado.
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo procesar la solicitud, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <BrandPanel
        title="Recupera el acceso a tu cuenta"
        description="Te enviaremos un enlace a tu correo registrado para que puedas elegir una contraseña nueva."
      />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          {sent ? (
            <div className="text-center sm:text-left">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:mx-0">
                <MailCheck className="h-6 w-6" />
              </span>
              <h2 className="font-display mt-4 text-2xl font-bold text-ink-900">Revisa tu correo</h2>
              <p className="mt-1 text-sm text-ink-500">
                Si <strong>{email}</strong> está registrado, te llegará un enlace para restablecer tu contraseña. Es válido por 30 minutos.
              </p>
              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-900 hover:underline sm:justify-start">
                <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-ink-900">¿Olvidaste tu contraseña?</h2>
              <p className="mb-6 mt-1 text-sm text-ink-500">Escribe el correo con el que te registraste.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Correo electrónico</Label>
                  <Input icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" variant="brand" size="lg" loading={loading} className="w-full">
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>

              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-900 hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver a iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
