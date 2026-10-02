import api from './axios'

export const estimateRoute = (data) => api.post('/api/routing/estimate', data)
