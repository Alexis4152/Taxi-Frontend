import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'

export default function PrivateRoute({ roles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <PageLoader />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
