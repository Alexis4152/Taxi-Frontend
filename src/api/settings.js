import api from './axios'

export const getPublicSettings = () => api.get('/api/settings/public')
