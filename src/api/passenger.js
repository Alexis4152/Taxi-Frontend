import api from './axios'

export const myProfile = () => api.get('/api/passenger/me')
export const myRatings = () => api.get('/api/passenger/ratings')

export const uploadPhoto = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/api/passenger/photo', form)
}
