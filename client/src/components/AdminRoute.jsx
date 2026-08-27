
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  // 1. Wait until AuthContext finishes checking local storage/session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Authenticating access...
      </div>
    );
  }

  // 2. Redirect to login if user isn't authenticated
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  // 4. Render protected admin children routes
  return children ?? <Outlet />;
}

export default AdminRoute;

