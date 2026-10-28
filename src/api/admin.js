import api from './axios'

// Organizaciones (solo SUPER_ADMIN)
export const listOrganizations = () => api.get('/api/admin/organizations')
export const getOrganization = (id) => api.get(`/api/admin/organizations/${id}`)
export const createOrganization = (data) => api.post('/api/admin/organizations', data)
export const updateOrganization = (id, data) => api.put(`/api/admin/organizations/${id}`, data)
export const setOrganizationActive = (id, active, reason) =>
  api.patch(`/api/admin/organizations/${id}/active`, null, { params: { active, reason: reason || undefined } })
export const markOrganizationPendingDeletion = (id, reason) =>
  api.post(`/api/admin/organizations/${id}/pending-deletion`, null, { params: { reason: reason || undefined } })
export const cancelOrganizationPendingDeletion = (id) => api.post(`/api/admin/organizations/${id}/pending-deletion/cancel`)
export const deleteOrganizationPermanently = (id) => api.delete(`/api/admin/organizations/${id}`)
export const uploadOrganizationLogo = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/api/admin/organizations/${id}/logo`, form)
}

// Configuracion de la plataforma (solo SUPER_ADMIN)
export const getPlatformSettings = () => api.get('/api/admin/platform-settings')
export const updatePlatformSettings = (data) => api.put('/api/admin/platform-settings', data)

// Operadores
export const listDrivers = () => api.get('/api/admin/drivers')
export const getDriver = (id) => api.get(`/api/admin/drivers/${id}`)
export const createDriver = (data) => api.post('/api/admin/drivers', data)
export const updateDriver = (id, data) => api.put(`/api/admin/drivers/${id}`, data)
export const uploadDriverPhoto = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/api/admin/drivers/${id}/photo`, form)
}
export const setDriverActive = (id, active, reason) =>
  api.patch(`/api/admin/drivers/${id}/active`, null, { params: { active, reason: reason || undefined } })
export const assignDriverTaxi = (id, taxiId) =>
  api.patch(`/api/admin/drivers/${id}/taxi`, null, { params: { taxiId: taxiId ?? undefined } })
export const markDriverPaid = (id) => api.post(`/api/admin/drivers/${id}/mark-paid`)
export const markDriverPendingDeletion = (id, reason) =>
  api.post(`/api/admin/drivers/${id}/pending-deletion`, null, { params: { reason: reason || undefined } })
export const cancelDriverPendingDeletion = (id) => api.post(`/api/admin/drivers/${id}/pending-deletion/cancel`)
export const deleteDriverPermanently = (id) => api.delete(`/api/admin/drivers/${id}`)

// Taxis
export const listTaxis = () => api.get('/api/admin/taxis')
export const getTaxi = (id) => api.get(`/api/admin/taxis/${id}`)
export const createTaxi = (data) => api.post('/api/admin/taxis', data)
export const updateTaxi = (id, data) => api.put(`/api/admin/taxis/${id}`, data)
export const uploadTaxiPhoto = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/api/admin/taxis/${id}/photo`, form)
}
export const setTaxiActive = (id, active, reason) =>
  api.patch(`/api/admin/taxis/${id}/active`, null, { params: { active, reason: reason || undefined } })
export const markTaxiPendingDeletion = (id, reason) =>
  api.post(`/api/admin/taxis/${id}/pending-deletion`, null, { params: { reason: reason || undefined } })
export const cancelTaxiPendingDeletion = (id) => api.post(`/api/admin/taxis/${id}/pending-deletion/cancel`)
export const deleteTaxiPermanently = (id) => api.delete(`/api/admin/taxis/${id}`)

// Solicitudes de cambio de taxi
export const listTaxiChangeRequests = () => api.get('/api/admin/taxi-change-requests')
export const approveTaxiChangeRequest = (id) => api.post(`/api/admin/taxi-change-requests/${id}/approve`)
export const rejectTaxiChangeRequest = (id) => api.post(`/api/admin/taxi-change-requests/${id}/reject`)

// Reportes de viaje (pasajero u operador reportando un problema en un viaje especifico)
export const listTripReports = (status = 'PENDING') => api.get('/api/admin/trip-reports', { params: { status } })
export const resolveTripReport = (id, comment) => api.post(`/api/admin/trip-reports/${id}/resolve`, { comment })

// Usuarios (pasajeros, solo SUPER_ADMIN)
export const listPassengers = () => api.get('/api/admin/passengers')
export const setPassengerActive = (id, active, reason) =>
  api.patch(`/api/admin/passengers/${id}/active`, null, { params: { active, reason: reason || undefined } })
export const markPassengerPendingDeletion = (id, reason) =>
  api.post(`/api/admin/passengers/${id}/pending-deletion`, null, { params: { reason: reason || undefined } })
export const cancelPassengerPendingDeletion = (id) => api.post(`/api/admin/passengers/${id}/pending-deletion/cancel`)
export const deletePassengerPermanently = (id) => api.delete(`/api/admin/passengers/${id}`)

// Solicitudes ARCO de datos personales (solo SUPER_ADMIN)
export const listArcoRequests = () => api.get('/api/admin/arco-requests')
export const resolveArcoRequest = (id, status, response) => api.patch(`/api/admin/arco-requests/${id}`, { status, response })

// Operadores conectados
export const listOnlineDrivers = () => api.get('/api/admin/drivers/online')

// Calificaciones de un operador (para que el admin vea comentarios)
export const driverRatings = (id) => api.get(`/api/admin/drivers/${id}/ratings`)
export const driverCurrentTrip = (id) => api.get(`/api/admin/drivers/${id}/current-trip`)

// Tarifas
export const upsertTariff = (data) => api.post('/api/admin/tariffs', data)

// Programa de referidos (solo lectura para admins)
export const listReferrals = () => api.get('/api/admin/referrals')
