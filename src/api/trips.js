import api from './axios'

export const requestTrip = (data) => api.post('/api/trips', data)
export const myActiveTripAsPassenger = () => api.get('/api/trips/mine/active')
export const myPassengerStats = () => api.get('/api/trips/mine/stats')
export const myTripHistory = () => api.get('/api/trips/mine/history')
export const getTripStatus = (id) => api.get(`/api/trips/${id}`)
export const cancelTrip = (id, reason) => api.post(`/api/trips/${id}/cancel`, reason ? { reason } : {})
export const nearbyDrivers = (lat, lng) => api.get('/api/trips/nearby-drivers', { params: { lat, lng } })
export const getTripMessages = (id) => api.get(`/api/trips/${id}/messages`)
export const sendTripMessage = (id, body) => api.post(`/api/trips/${id}/messages`, { body })
export const getPublicTrip = (shareToken) => api.get(`/api/public/trips/${shareToken}`)
