import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Phone, Mail, Lock, AlertCircle, Car, UserRound, Hash, Gift } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandPanel from '../components/ui/BrandPanel'
import Logo from '../components/ui/Logo'
import PhotoPicker from '../components/ui/PhotoPicker'
import { Label, Input, Select } from '../components/ui/Field'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import * as passengerApi from '../api/passenger'
import * as driverApi from '../api/driver'
import { VEHICLE_CATALOG, OTHER_OPTION, modelsForBrand } from '../data/vehicleCatalog'

const emptyForm = {
  name: '',
  phone: '',
  password: '',
  email: '',
  taxiUnitNumber: '',
  taxiPlates: '',
  taxiBrand: '',
  taxiModel: '',
  referralCode: '',
}

export default function RegisterPage() {
  const { register, registerDriver, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [role, setRole] = useState('PASSENGER')
  const [form, setForm] = useState(() => {
    const ref = searchParams.get('ref')
    return ref ? { ...emptyForm, referralCode: ref.toUpperCase() } : emptyForm
  })
  const [brandChoice, setBrandChoice] = useState('')
  const [modelChoice, setModelChoice] = useState('')
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const selectBrand = (e) => {
    const value = e.target.value
    setBrandChoice(value)
    setModelChoice('')
    setForm((f) => ({ ...f, taxiBrand: value === OTHER_OPTION ? '' : value, taxiModel: '' }))
  }

  const selectModel = (e) => {
    const value = e.target.value
    setModelChoice(value)
    setForm((f) => ({ ...f, taxiModel: value === OTHER_OPTION ? '' : value }))
  }

  const updatePhone = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((f) => ({ ...f, phone: digitsOnly }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!acceptedTerms) {
      setError('Debes aceptar los terminos y condiciones para continuar')
      return
    }
    if (!acceptedPrivacy) {
      setError('Debes aceptar el aviso de privacidad para continuar')
      return
    }
    if (form.phone.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos')
      return
    }
    if (role === 'DRIVER' && !photo) {
      setError('La foto de perfil es obligatoria para operadores')
      return
    }
    setLoading(true)
    let photoUploadFailed = false
    try {
      if (role === 'PASSENGER') {
        await register({
          name: form.name,
          phone: form.phone,
          password: form.password,
          email: form.email,
          acceptedTerms,
          acceptedPrivacy,
          marketingOptIn,
          referralCode: form.referralCode || null,
        })
        if (photo) {
          // La foto es un paso aparte del registro: si falla, no debe impedir que la cuenta quede
          // creada (se puede subir despues).
          await passengerApi.uploadPhoto(photo).catch(() => {})
        }
      } else {
        await registerDriver({
          name: form.name,
          phone: form.phone,
          password: form.password,
          email: form.email,
          taxiUnitNumber: form.taxiUnitNumber,
          taxiPlates: form.taxiPlates,
          taxiBrand: form.taxiBrand,
          taxiModel: form.taxiModel,
          acceptedTerms,
          acceptedPrivacy,
          marketingOptIn,
          referralCode: form.referralCode || null,
        })
        try {
          await driverApi.uploadPhoto(photo)
        } catch {
          // La cuenta ya quedo creada - se lo dejamos saber para que suba la foto al entrar, en vez
          // de fallar todo el registro por un problema de subida (ej. mala conexion).
          photoUploadFailed = true
        }
      }
      // Se crea la cuenta y se sube la foto ya autenticado (necesario para esos pasos), pero no se
      // deja al usuario "ya adentro": se cierra esa sesion y se le manda a iniciar sesion de nuevo,
      // para que el flujo de entrada sea siempre el mismo (login), sin importar que se acaba de
      // registrar.
      await logout()
      navigate('/login', { state: { registered: true, photoUploadFailed } })
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <BrandPanel
        eyebrow="Crea tu cuenta"
        title="Solo pedimos lo esencial para empezar"
        description="Como pasajero, pide tu primer viaje en minutos. Como operador, trae tu propio taxi y empieza a recibir solicitudes."
      />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-900">Crea tu cuenta</h2>
          <p className="mb-6 mt-1 text-sm text-ink-500">Elige cómo quieres usar NexoraTaxis</p>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('PASSENGER')}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                role === 'PASSENGER'
                  ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'border-ink-100 text-ink-500 hover:border-ink-200'
              }`}
            >
              <UserRound className="h-4 w-4" /> Pasajero
            </button>
            <button
              type="button"
              onClick={() => setRole('DRIVER')}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                role === 'DRIVER'
                  ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'border-ink-100 text-ink-500 hover:border-ink-200'
              }`}
            >
              <Car className="h-4 w-4" /> Operador
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PhotoPicker value={photo} onChange={setPhoto} required={role === 'DRIVER'} />
            <div>
              <Label>Nombre completo</Label>
              <Input icon={User} required value={form.name} onChange={update('name')} />
            </div>
            <div>
              <Label>Teléfono (obligatorio)</Label>
              <Input
                icon={Phone}
                type="tel"
                inputMode="numeric"
                required
                minLength={10}
                maxLength={10}
                value={form.phone}
                onChange={updatePhone}
                placeholder="10 dígitos"
              />
            </div>
            <div>
              <Label>Correo</Label>
              <Input icon={Mail} type="email" required value={form.email} onChange={update('email')} placeholder="Para recuperar tu contraseña" />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                icon={Lock}
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={update('password')}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {role === 'DRIVER' && (
              <div className="space-y-3 rounded-xl border border-ink-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Tu taxi</p>
                <div>
                  <Label>Número de unidad</Label>
                  <Input icon={Hash} required value={form.taxiUnitNumber} onChange={update('taxiUnitNumber')} />
                </div>
                <div>
                  <Label>Placas</Label>
                  <Input required value={form.taxiPlates} onChange={update('taxiPlates')} placeholder="ABC-123-D" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Marca</Label>
                    <Select required value={brandChoice} onChange={selectBrand}>
                      <option value="" disabled>
                        Selecciona una marca
                      </option>
                      {VEHICLE_CATALOG.map((b) => (
                        <option key={b.brand} value={b.brand}>
                          {b.brand}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Otra marca</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    {brandChoice && brandChoice !== OTHER_OPTION ? (
                      <Select required value={modelChoice} onChange={selectModel}>
                        <option value="" disabled>
                          Selecciona un modelo
                        </option>
                        {modelsForBrand(brandChoice).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                        <option value={OTHER_OPTION}>Otro modelo</option>
                      </Select>
                    ) : (
                      <Input
                        required
                        disabled={!brandChoice}
                        value={form.taxiModel}
                        onChange={update('taxiModel')}
                        placeholder={brandChoice ? 'Modelo' : 'Primero elige una marca'}
                      />
                    )}
                  </div>
                </div>
                {brandChoice === OTHER_OPTION && (
                  <Input
                    required
                    value={form.taxiBrand}
                    onChange={update('taxiBrand')}
                    placeholder="Escribe la marca de tu auto"
                  />
                )}
                {modelChoice === OTHER_OPTION && brandChoice !== OTHER_OPTION && (
                  <Input
                    required
                    value={form.taxiModel}
                    onChange={update('taxiModel')}
                    placeholder="Escribe el modelo de tu auto"
                  />
                )}
                <p className="text-[11px] text-ink-400">
                  Solo se aceptan sedanes, compactos y hatchbacks (sin pickups, SUVs ni deportivos). Si
                  otro operador ya registró este taxi, quedarás vinculado a esa misma unidad (varios
                  operadores pueden compartir un taxi).
                </p>
              </div>
            )}

            <div>
              <Label hint="opcional">Código de referido</Label>
              <Input
                icon={Gift}
                value={form.referralCode}
                onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                placeholder="Si alguien te invitó, ponlo aquí"
                maxLength={10}
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-ink-600">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="font-semibold text-ink-900 underline underline-offset-2"
                >
                  términos y condiciones
                </button>
                : soy responsable de los viajes que solicite y acepte.
              </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-ink-600">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <span>
                He leído y acepto el{' '}
                <Link to="/privacidad" target="_blank" className="font-semibold text-ink-900 underline underline-offset-2">
                  aviso de privacidad
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-ink-600">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
              />
              <span>Quiero recibir promociones y novedades (opcional).</span>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="brand" size="lg" loading={loading} disabled={!acceptedTerms || !acceptedPrivacy} className="w-full">
              {loading ? 'Creando...' : 'Registrarme'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-ink-900 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="Términos y condiciones">
        <div className="space-y-3 text-sm text-ink-600">
          <p>
            Al usar NexoraTaxis, cada usuario (pasajero u operador) es responsable de los viajes que
            solicite o acepte a través de la plataforma.
          </p>
          <p>
            El pasajero se compromete a estar disponible en el punto de origen acordado y, en caso de
            un viaje programado, a la hora seleccionada. El operador se compromete a realizar el viaje
            que acepta, incluyendo los viajes que se comprometió a realizar en un horario programado.
          </p>
          <p>
            NexoraTaxis actúa como intermediario tecnológico entre pasajeros y operadores
            independientes u organizaciones de taxis; la responsabilidad de completar el servicio
            solicitado corresponde a las partes que solicitan y aceptan cada viaje.
          </p>
          <p>
            El tratamiento de tus datos personales se rige por nuestro{' '}
            <Link to="/privacidad" target="_blank" className="font-semibold text-ink-900 underline underline-offset-2">
              aviso de privacidad
            </Link>
            .
          </p>
        </div>
      </Modal>
    </div>
  )
}
