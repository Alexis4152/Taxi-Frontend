import api from './axios'

export const myProfile = () => api.get('/api/passenger/me')
export const myRatings = () => api.get('/api/passenger/ratings')

export const uploadPhoto = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/api/passenger/photo', form)
}

export const listSavedPlaces = () => api.get('/api/passenger/saved-places')
export const createSavedPlace = (data) => api.post('/api/passenger/saved-places', data)
export const deleteSavedPlace = (id) => api.delete(`/api/passenger/saved-places/${id}`)

export const requestAccountDeletion = () => api.post('/api/passenger/request-deletion')
