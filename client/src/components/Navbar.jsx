import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow flex justify-between items-center">
      <Link to="/" className="text-xl font-bold tracking-wide">Amitto</Link>

      <div className="flex items-center gap-5 text-sm font-medium">
        <Link to="/" className="hover:underline opacity-90 hover:opacity-100">Home</Link>

        {!user && (
          <>
            <Link to="/login" className="hover:underline opacity-90 hover:opacity-100">Login</Link>
            <Link to="/register" className="hover:underline opacity-90 hover:opacity-100">Register</Link>
          </>
        )}

        {user && (
          <>
            <Link to="/create-post" className="hover:underline opacity-90 hover:opacity-100">Create Post</Link>
            
            {/* Profile Navigation Link with Avatar / Initial Badge */}
            <Link to="/profile" className="flex items-center gap-2 hover:underline opacity-90 hover:opacity-100">
              {user.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold border border-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
              <span>Profile</span>
            </Link>
          </>
        )}

        {user && isAdmin && (
          <Link to="/admin" className="hover:underline text-yellow-300 font-semibold">Admin Panel</Link>
        )}

        {user && (
          <button 
            onClick={handleLogout} 
            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded transition text-xs font-semibold"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;