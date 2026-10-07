import api from './axios'

export const registerPassenger = (data) => api.post('/api/auth/register', data)
export const registerDriver = (data) => api.post('/api/auth/register-driver', data)
export const login = (data) => api.post('/api/auth/login', data)
export const refreshSession = () => api.post('/api/auth/refresh')
export const logout = () => api.post('/api/auth/logout')
export const forgotPassword = (data) => api.post('/api/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/api/auth/reset-password', data)
export const changePassword = (data) => api.post('/api/auth/change-password', data)
export const fetchMe = () => api.get('/api/auth/me') 
