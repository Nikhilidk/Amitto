import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">Amitto</Link>

      <div className="flex items-center gap-4 text-sm">
        {!user && (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
        {user && isAdmin && (
          <Link to="/admin" className="hover:underline">Admin Panel</Link>
        )}
        {user && (
          <button onClick={handleLogout} className="hover:underline">Logout</button>
        )}
      </div>
    </nav>
  )
}

export default Navbar