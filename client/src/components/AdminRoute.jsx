import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function AdminRoute({ children }) {
    const { user, loading, isAdmin } = useAuth()

    if (loading) return null
    if (!user || !isAdmin) return <Navigate to="/login" replace />

    return children
}

export default AdminRoute