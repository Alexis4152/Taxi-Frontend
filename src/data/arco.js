// Etiquetas compartidas entre el centro de privacidad del usuario y la bandeja ARCO del admin.
export const ARCO_TYPES = [
  { value: 'ACCESS', label: 'Acceso', hint: 'Saber qué datos personales tenemos de ti y cómo los usamos.' },
  { value: 'RECTIFICATION', label: 'Rectificación', hint: 'Corregir datos inexactos o incompletos.' },
  { value: 'CANCELLATION', label: 'Cancelación', hint: 'Que eliminemos tus datos (para borrar tu cuenta usa "Eliminar mi cuenta").' },
  { value: 'OPPOSITION', label: 'Oposición', hint: 'Que dejemos de usar tus datos para un fin específico.' },
  { value: 'REVOKE_CONSENT', label: 'Revocar consentimiento', hint: 'Retirar un consentimiento que nos diste.' },
  { value: 'LIMIT_USE', label: 'Limitar uso o divulgación', hint: 'Restringir con quién o para qué compartimos tus datos.' },
]

export const ARCO_TYPE_LABEL = Object.fromEntries(ARCO_TYPES.map((t) => [t.value, t.label]))

export const ARCO_STATUS = {
  PENDING: { label: 'Recibida', tone: 'warning' },
  IN_PROGRESS: { label: 'En proceso', tone: 'info' },
  RESOLVED: { label: 'Atendida', tone: 'success' },
  REJECTED: { label: 'Rechazada', tone: 'danger' },
}

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
