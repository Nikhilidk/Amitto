import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null // or a spinner component

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute