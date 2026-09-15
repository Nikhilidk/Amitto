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
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen w-full relative bg-[#F5EFE6] flex items-center justify-center font-sans overflow-hidden">
      
      {/* Background Watermarks */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Soft Background Accent Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D2A066]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-[#838A60]/20 rounded-full blur-3xl" />

        {/* Subtle Magnifying Glass SVG (Top Left Watermark) */}
        <svg 
          className="absolute -top-6 -left-6 w-96 h-96 text-[#2D2A32]/[0.06] transform -rotate-12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8a3 3 0 0 0-3 3" />
        </svg>

        {/* Subtle Exclamation Point SVG (Bottom Center/Left Watermark) */}
        <svg 
          className="absolute -bottom-10 left-1/3 w-72 h-72 text-[#B85028]/[0.07] transform rotate-12" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>

      {/* Main Grid Container */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 md:grid-cols-12">
        
        {/* LEFT PANEL: Branding & Messaging */}
        <div className="md:col-span-6 p-8 sm:p-16 flex flex-col justify-between order-2 md:order-1 border-r border-[#2D2A32]/10 text-left">
          <div>
            <span className="text-xs font-black tracking-[0.25em] text-[#2D2A32]/70 uppercase block">
              Campus Lost & Found
            </span>
            <h1 className="text-5xl font-black text-[#2D2A32] tracking-tight mt-1">
              AMITTO
            </h1>
            <p className="text-sm font-serif italic text-[#2D2A32]/70 mt-1">
              You lost it? We found it!
            </p>
          </div>

          <div className="my-auto py-12 max-w-lg">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#2D2A32] leading-[1.15] tracking-tight">
              Reconnecting items with their owners.
            </h2>
            <p className="text-base text-[#2D2A32]/80 font-medium mt-4 leading-relaxed">
              Log in to search through reported lost items, post found belongings, and connect securely with verified campus members.
            </p>
          </div>

          <div className="text-xs font-bold tracking-widest text-[#2D2A32]/60 uppercase">
            Verified Student Access Network
          </div>
        </div>

        {/* RIGHT PANEL: Form Area */}
        <div className="md:col-span-6 bg-white/70 backdrop-blur-md p-8 sm:p-16 flex flex-col justify-center order-1 md:order-2 shadow-xl text-left">
          <div className="max-w-md mx-auto w-full">
            
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-[#2D2A32] tracking-tight">Get started!</h2>
              <p className="text-[#2D2A32]/70 text-sm mt-1.5 font-medium">Please enter your account credentials.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-semibold px-4 py-3 rounded-xl mb-6">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-2">
                  User name or email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your user name or email"
                    className="w-full bg-white border border-[#2D2A32]/20 rounded-xl px-4 py-3.5 pr-11 text-sm font-medium text-[#2D2A32] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2A32] transition shadow-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-white border border-[#2D2A32]/20 rounded-xl px-4 py-3.5 pr-11 text-sm font-medium text-[#2D2A32] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2A32] transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2D2A32] transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#2D2A32] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#2D2A32]/40 text-[#2D2A32] focus:ring-[#2D2A32] h-4 w-4"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D2A32] text-white font-bold tracking-wider py-3.5 rounded-xl hover:bg-[#3f3b46] active:scale-[0.99] disabled:opacity-50 transition shadow-lg mt-4"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  )
}

export default Login