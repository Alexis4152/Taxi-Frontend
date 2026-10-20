import api from './axios'

export const registerPassenger = (data) => api.post('/api/auth/register', data)
export const registerDriver = (data) => api.post('/api/auth/register-driver', data)
export const login = (data) => api.post('/api/auth/login', data)
export const refreshSession = (refreshToken) => api.post('/api/auth/refresh', { refreshToken })
export const logout = (refreshToken) => api.post('/api/auth/logout', { refreshToken })
export const forgotPassword = (data) => api.post('/api/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/api/auth/reset-password', data)
export const changePassword = (data) => api.post('/api/auth/change-password', data)
export const fetchMe = () => api.get('/api/auth/me') 
