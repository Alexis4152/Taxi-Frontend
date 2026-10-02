import api from './axios'

// Organizaciones (solo SUPER_ADMIN)
export const listOrganizations = () => api.get('/api/admin/organizations')
export const getOrganization = (id) => api.get(`/api/admin/organizations/${id}`)
export const createOrganization = (data) => api.post('/api/admin/organizations', data)
export const updateOrganization = (id, data) => api.put(`/api/admin/organizations/${id}`, data)
export const setOrganizationActive = (id, active) =>
  api.patch(`/api/admin/organizations/${id}/active`, null, { params: { active } })
export const uploadOrganizationLogo = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/api/admin/organizations/${id}/logo`, form)
}

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
export const setDriverActive = (id, active) =>
  api.patch(`/api/admin/drivers/${id}/active`, null, { params: { active } })
export const assignDriverTaxi = (id, taxiId) =>
  api.patch(`/api/admin/drivers/${id}/taxi`, null, { params: { taxiId: taxiId ?? undefined } })

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
export const setTaxiActive = (id, active) =>
  api.patch(`/api/admin/taxis/${id}/active`, null, { params: { active } })

// Solicitudes de cambio de taxi
export const listTaxiChangeRequests = () => api.get('/api/admin/taxi-change-requests')
export const approveTaxiChangeRequest = (id) => api.post(`/api/admin/taxi-change-requests/${id}/approve`)
export const rejectTaxiChangeRequest = (id) => api.post(`/api/admin/taxi-change-requests/${id}/reject`)

// Usuarios (pasajeros, solo SUPER_ADMIN)
export const listPassengers = () => api.get('/api/admin/passengers')
export const setPassengerActive = (id, active) =>
  api.patch(`/api/admin/passengers/${id}/active`, null, { params: { active } })

// Operadores conectados
export const listOnlineDrivers = () => api.get('/api/admin/drivers/online')

// Calificaciones de un operador (para que el admin vea comentarios)
export const driverRatings = (id) => api.get(`/api/admin/drivers/${id}/ratings`)
export const driverCurrentTrip = (id) => api.get(`/api/admin/drivers/${id}/current-trip`)

// Tarifas
export const upsertTariff = (data) => api.post('/api/admin/tariffs', data)
