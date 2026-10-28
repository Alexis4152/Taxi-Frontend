import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../components/ui/Logo'
import ThemeToggle from '../components/ui/ThemeToggle'
import { PRIVACY_CONTROLLER } from '../config'

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink-600">{children}</div>
    </section>
  )
}

function List({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

// Aviso de privacidad integral (LFPDPPP). Es publico (no requiere sesion) para que se pueda leer
// antes de registrarse; los datos del responsable salen de config.js (PRIVACY_CONTROLLER).
export default function PrivacyNoticePage() {
  const navigate = useNavigate()
  const { name, address, email, lastUpdated } = PRIVACY_CONTROLLER

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="w-44">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/login'))}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Regresar
        </button>

        <div className="space-y-7 rounded-2xl border border-ink-100 bg-surface p-6 shadow-sm sm:p-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Aviso de privacidad integral</h1>
            <p className="mt-1 text-xs text-ink-400">Última actualización: {lastUpdated}</p>
          </div>

          <Section title="1. Quién es responsable de tus datos">
            <p>
              {name} (en adelante, “NexoraTaxis”), con domicilio en {address}, es responsable del uso y protección de
              tus datos personales, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares y su normativa aplicable.
            </p>
            <p>
              Para cualquier tema de privacidad puedes escribirnos a <strong className="text-ink-900">{email}</strong> o
              usar la sección <strong className="text-ink-900">Privacidad y mis datos</strong> del menú de tu cuenta.
            </p>
          </Section>

          <Section title="2. Qué datos recabamos">
            <p className="font-medium text-ink-800">Si eres pasajero:</p>
            <List
              items={[
                'Identificación y contacto: nombre, teléfono, correo electrónico y fotografía (opcional).',
                'Ubicación: punto de origen y destino de tus viajes y tu ubicación aproximada mientras usas la app (solo si das permiso en tu dispositivo).',
                'Datos del servicio: historial de viajes, tarifas, método de pago (efectivo o tarjeta, sin guardar datos de la tarjeta), calificaciones, comentarios, mensajes del chat del viaje y reportes.',
                'Lugares guardados y contactos de confianza que tú decidas registrar (nombre y teléfono de esas personas).',
              ]}
            />
            <p className="font-medium text-ink-800">Si eres operador:</p>
            <List
              items={[
                'Identificación y contacto: nombre, teléfono, correo electrónico, fotografía y domicilio.',
                'Datos del vehículo: número de unidad, placas, marca y modelo.',
                'Datos patrimoniales: cuenta bancaria para pagos y saldo de comisiones por pagar.',
                'Ubicación en tiempo real únicamente mientras estás conectado para recibir viajes.',
                'Datos del servicio: viajes realizados, ganancias, calificaciones, mensajes y reportes.',
              ]}
            />
            <p className="font-medium text-ink-800">De forma automática:</p>
            <List items={['Datos técnicos de la sesión (fecha y hora de acceso, tipo de navegador o dispositivo).']} />
            <p>
              <strong className="text-ink-900">No recabamos datos personales sensibles</strong> (como datos biométricos, de
              salud o antecedentes penales). Si en el futuro fuera necesario, te pediremos tu consentimiento expreso y por
              escrito antes de hacerlo.
            </p>
          </Section>

          <Section title="3. Para qué usamos tus datos">
            <p className="font-medium text-ink-800">Finalidades primarias (necesarias para el servicio):</p>
            <List
              items={[
                'Crear y administrar tu cuenta y verificar tu identidad al iniciar sesión.',
                'Conectar a pasajeros con operadores cercanos, calcular rutas y tarifas, y dar seguimiento al viaje en tiempo real.',
                'Permitir la comunicación entre pasajero y operador durante el viaje.',
                'Seguridad: código de verificación del viaje, compartir el viaje con tus contactos de confianza y atender reportes o incidentes.',
                'Cobrar comisiones de la plataforma a operadores y llevar el control de pagos.',
                'Atender aclaraciones, quejas y requerimientos de autoridades, y cumplir obligaciones legales y fiscales.',
              ]}
            />
            <p className="font-medium text-ink-800">Finalidades secundarias (opcionales):</p>
            <List items={['Enviarte promociones, novedades y encuestas de satisfacción.']} />
            <p>
              Puedes negarte a las finalidades secundarias desde el registro o en cualquier momento en{' '}
              <strong className="text-ink-900">Privacidad y mis datos</strong>. Negarte no afecta el servicio.
            </p>
          </Section>

          <Section title="4. Uso de tu ubicación">
            <p>
              La ubicación del pasajero se usa para fijar el punto de partida, mostrar taxis cercanos y seguir el viaje. La
              del operador solo se registra mientras está conectado. Guardamos tu última ubicación conocida únicamente para
              centrar el mapa la próxima vez que abras la app; no llevamos un historial de tus movimientos fuera de los
              viajes.
            </p>
          </Section>

          <Section title="5. Con quién compartimos tus datos">
            <List
              items={[
                'Con el operador (o pasajero) de tu viaje: nombre, foto, calificación, ubicación y datos del vehículo, solo lo necesario para realizarlo.',
                'Con la organización de taxis a la que pertenece el operador, para administrar su flotilla y atender incidentes.',
                'Con las personas con quienes tú decidas compartir el seguimiento de un viaje.',
                'Con autoridades competentes, cuando lo requieran por ley o mandato judicial.',
              ]}
            />
            <p>
              También usamos proveedores que tratan datos por nuestra cuenta (alojamiento del servicio, mapas y rutas
              basados en OpenStreetMap, y envío de correos), obligados a protegerlos. Estas comunicaciones no requieren tu
              consentimiento conforme a la ley. No vendemos tus datos.
            </p>
          </Section>

          <Section title="6. Tus derechos ARCO">
            <p>
              Tienes derecho a <strong className="text-ink-900">Acceder</strong> a tus datos,{' '}
              <strong className="text-ink-900">Rectificarlos</strong>, <strong className="text-ink-900">Cancelarlos</strong>{' '}
              y <strong className="text-ink-900">Oponerte</strong> a su uso para fines específicos. También puedes revocar
              tu consentimiento y limitar el uso o divulgación de tus datos.
            </p>
            <List
              items={[
                'Dentro de la app: menú de tu cuenta → Privacidad y mis datos. Ahí puedes descargar tus datos, cambiar tus preferencias y enviar una solicitud; recibirás un folio.',
                `Por correo a ${email}, indicando tu nombre, teléfono registrado, el derecho que quieres ejercer y una descripción clara de lo que solicitas. Para rectificar, adjunta el documento que respalde el cambio.`,
                'Para eliminar tu cuenta, usa la opción “Eliminar mi cuenta” en tu perfil: tu acceso se bloquea de inmediato y se registra como solicitud de cancelación.',
              ]}
            />
            <p>
              Te responderemos en un máximo de <strong className="text-ink-900">20 días hábiles</strong> desde que recibimos
              tu solicitud y, si procede, la haremos efectiva dentro de los{' '}
              <strong className="text-ink-900">15 días hábiles</strong> siguientes. El trámite es gratuito. Por tu seguridad,
              solo atendemos solicitudes desde tu cuenta o con datos que nos permitan verificar que eres el titular.
            </p>
          </Section>

          <Section title="7. Cuánto tiempo conservamos tus datos">
            <List
              items={[
                'Datos de tu cuenta: mientras esté activa.',
                'Al eliminar tu cuenta, tus datos personales se anonimizan: se borran tu nombre, teléfono, correo, foto, cuenta bancaria, domicilio, lugares guardados, contactos de confianza, mensajes y comentarios, y las direcciones exactas de tus viajes.',
                'Los registros de viajes y cobros se conservan sin datos que te identifiquen hasta por 5 años, por obligaciones fiscales y para atender aclaraciones.',
                'Los reportes de incidentes de seguridad se conservan el tiempo necesario para atender posibles reclamaciones o requerimientos de autoridad.',
              ]}
            />
          </Section>

          <Section title="8. Almacenamiento en tu navegador">
            <p>
              No usamos cookies de rastreo ni publicidad. La app guarda en tu navegador únicamente tu sesión (que se borra al
              cerrar la pestaña) y tu preferencia de tema claro u oscuro.
            </p>
          </Section>

          <Section title="9. Cambios a este aviso">
            <p>
              Si actualizamos este aviso, te lo mostraremos al iniciar sesión para que lo revises y lo aceptes. La versión
              vigente siempre estará en esta página.
            </p>
          </Section>

          <Section title="10. Autoridad">
            <p>
              Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir ante la
              autoridad garante en materia de protección de datos personales.
            </p>
          </Section>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          <Link to="/login" className="font-semibold text-ink-900 hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </main>
    </div>
  )
}
