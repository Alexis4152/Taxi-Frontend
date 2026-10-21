import api from './axios'

export const myReferral = () => api.get('/api/referrals/me')
