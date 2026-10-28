import api from './axios'

export const acceptPrivacyNotice = (marketingOptIn) => api.post('/api/privacy/accept', { marketingOptIn })
export const updatePrivacyPreferences = (marketingOptIn) => api.put('/api/privacy/preferences', { marketingOptIn })
export const downloadMyData = () => api.get('/api/privacy/my-data')
export const listMyArcoRequests = () => api.get('/api/privacy/arco-requests')
export const createArcoRequest = (data) => api.post('/api/privacy/arco-requests', data)
