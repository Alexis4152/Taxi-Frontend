import api from './axios'

export const searchAddress = (query) => api.get('/api/geocoding/search', { params: { q: query } })
export const reverseGeocode = (lat, lng) => api.get('/api/geocoding/reverse', { params: { lat, lng } })
