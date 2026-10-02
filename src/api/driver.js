import api from './axios'

export const myProfile = () => api.get('/api/driver/me')
export const uploadPhoto = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/api/driver/photo', form)
}
export const myTaxi = () => api.get('/api/driver/my-taxi')
export const requestTaxiChange = (data) => api.post('/api/driver/taxi-change-requests', data)
export const myTaxiChangeRequests = () => api.get('/api/driver/taxi-change-requests')
export const driverStats = () => api.get('/api/driver/stats')
export const myRatings = () => api.get('/api/driver/ratings')
export const myTripHistory = () => api.get('/api/driver/trips/history')
export const pingLocation = (data) => api.post('/api/driver/location', data)
export const goOffline = () => api.post('/api/driver/offline')
export const myActiveTripAsDriver = () => api.get('/api/driver/trips/active')
export const acceptOffer = (tripId, offerId) => api.post(`/api/driver/trips/${tripId}/offers/${offerId}/accept`)
export const rejectOffer = (tripId, offerId) => api.post(`/api/driver/trips/${tripId}/offers/${offerId}/reject`)
export const startTrip = (tripId) => api.post(`/api/driver/trips/${tripId}/start`)
export const completeTrip = (tripId) => api.post(`/api/driver/trips/${tripId}/complete`)
export const confirmPayment = (tripId) => api.post(`/api/driver/trips/${tripId}/confirm-payment`)
