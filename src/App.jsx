import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PassengerHome from './pages/PassengerHome'
import DriverHome from './pages/DriverHome'
import AdminDashboard from './pages/AdminDashboard'
import TrackTripPage from './pages/TrackTripPage'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/track/:shareToken" element={<TrackTripPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute roles={['PASSENGER']}>
            <PassengerHome />
          </PrivateRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <PrivateRoute roles={['DRIVER']}>
            <DriverHome />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
