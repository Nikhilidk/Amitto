import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginUser(formData)
      login(result.user, result.token, rememberMe)
      navigate('/')
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-sky-200 to-indigo-200 flex items-center justify-center p-4 sm:p-6 md:p-8">
      
      {/* Outer Photoframe Container */}
      <div className="w-full max-w-5xl rounded-[32px] p-2 bg-white/30 backdrop-blur-md border border-white/60 shadow-2xl">
        
        {/* Inner Split Grid Container */}
        <div className="bg-white rounded-[26px] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] shadow-inner">
          
          {/* LEFT SIDE: Login Form Area */}
          <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white order-2 md:order-1">
            <div className="max-w-md mx-auto w-full">
              
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Log back in</h2>
                <p className="text-slate-500 text-sm mt-1">Access your campus account to view & track items.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@college.edu"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-medium">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition shadow-md shadow-indigo-200 pt-3"
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>

            </div>
          </div>

          {/* RIGHT SIDE: Hero Brand Banner ("Welcome Back!") */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden order-1 md:order-2">
            
            {/* Background Glow Blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Name */}
            <div className="relative z-10">
              <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">Campus Lost & Found</span>
              <h1 className="text-3xl font-black tracking-tight mt-1 text-white">AMITTO</h1>
            </div>

            {/* Center Welcome Header */}
            <div className="relative z-10 my-8">
              <h2 className="text-3xl font-extrabold leading-tight">
                Welcome Back!
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Glad to see you again and thank you for being part of the community!.
              </p>
            </div>

            {/* Bottom Tagline */}
            <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Secure & Authenticated Campus Access</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}

export default Login