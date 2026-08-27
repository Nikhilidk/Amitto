import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminRoute({ children }) {
    const { user, loading, isAdmin } = useAuth()

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading access control...</div>
    }

    if (!user || !isAdmin) {
        return <Navigate to="/login" replace />
    }

    return children
}