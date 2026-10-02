import api from './axios'

export const submitRating = (data) => api.post('/api/ratings', data)
