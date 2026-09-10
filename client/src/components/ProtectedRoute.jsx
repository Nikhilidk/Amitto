import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, requireApproved = false, requireAdmin = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (requireApproved && user.verificationStatus !== 'approved') {
    return <Navigate to="/profile" replace />
  }

  return children
}

export default ProtectedRoute