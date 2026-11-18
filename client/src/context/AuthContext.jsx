import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check both storages — whichever has the data determines the active session
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, jwtToken, rememberMe = false) => {
    setUser(userData)
    setToken(jwtToken)

    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('token', jwtToken)
    storage.setItem('user', JSON.stringify(userData))
  }

  // Merge new fields (e.g. photoUrl) into the current user and persist them
  const updateUser = (partial) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...partial }
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage
      storage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  const isVerified = user?.verificationStatus === 'approved'
  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, isVerified, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}