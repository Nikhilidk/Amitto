import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function AdminRoute() {
  const { user, loading } = useAuth();

  // 1. Wait until AuthContext finishes checking local storage/session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Authenticating access...
      </div>
    );
  }

  // 2. Redirect to login if user isn't authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Redirect standard students back home if they try accessing /admin
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 4. Render protected admin children routes
  return <Outlet />;
}

export default AdminRoute;