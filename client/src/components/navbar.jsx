import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  const loadUser = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    loadUser()
    
    // Listen for storage events or custom login triggers
    window.addEventListener('storage', loadUser)
    return () => {
      window.removeEventListener('storage', loadUser)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    
    // Dispatch event so other components know storage has changed
    window.dispatchEvent(new Event('storage'))
    navigate('/login')
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            AMITTO
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              <span className="text-slate-300 hidden sm:inline">
                Welcome, <span className="text-blue-400 font-semibold">{user.name}</span>
              </span>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-lg hover:bg-indigo-600/30 transition duration-200"
                >
                  Admin Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg transition duration-200"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white transition duration-200">
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-500/10 transition duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar