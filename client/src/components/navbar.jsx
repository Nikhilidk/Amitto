import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">Amitto</Link>

      <div className="flex items-center gap-4 text-sm font-medium">
        {isAdmin && (
          <Link to="/admin" className="hover:underline">
            Admin Panel
          </Link>
        )}

        {user ? (
          <>
            <span className="opacity-80">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar