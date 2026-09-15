import { useState } from 'react'
import { registerUser, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [idFile, setIdFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIdFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!idFile) {
      setError('Please upload your ID photo')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const result = await registerUser(
        { name: formData.name, email: formData.email, password: formData.password, idFile },
        (pct) => setProgress(pct)
      )
      setSuccess(result.message)
      login(result.user, result.token)
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
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#838A60]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-[#B85028]/20 rounded-full blur-3xl" />

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
          className="absolute -bottom-10 left-1/4 w-72 h-72 text-[#2D2A32]/[0.06] transform rotate-6" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>

      {/* Main Grid Container */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 md:grid-cols-12">

        {/* LEFT PANEL: Branding & Messaging */}
        <div className="md:col-span-5 p-8 sm:p-16 flex flex-col justify-between order-2 md:order-1 border-r border-[#2D2A32]/10 text-left">
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

          <div className="my-auto py-12 max-w-md">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#2D2A32] leading-[1.15] tracking-tight">
              Find, Post,<br />And help others.
            </h2>
            <p className="text-base text-[#2D2A32]/80 font-medium mt-4 leading-relaxed">
              Join a verified campus community dedicated to returning lost items safely.
            </p>
          </div>

          <div className="text-xs font-bold tracking-widest text-[#2D2A32]/60 uppercase">
            Verified Student Registration
          </div>
        </div>

        {/* RIGHT PANEL: Form Area */}
        <div className="md:col-span-7 bg-white/70 backdrop-blur-md p-8 sm:p-16 flex flex-col justify-center order-1 md:order-2 shadow-xl text-left">
          <div className="max-w-md mx-auto w-full">

            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-[#2D2A32] tracking-tight">Create Account</h2>
              <p className="text-[#2D2A32]/70 text-sm mt-1 font-medium">Fill in your details to register.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Full Name"
                  className="w-full bg-white border border-[#2D2A32]/20 rounded-xl px-4 py-2.5 text-sm font-medium text-[#2D2A32] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2A32] transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-1">College Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="student@college.edu"
                  className="w-full bg-white border border-[#2D2A32]/20 rounded-xl px-4 py-2.5 text-sm font-medium text-[#2D2A32] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2A32] transition shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#2D2A32]/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-[#2D2A32] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2A32] transition shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2D2A32] transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-1">Confirm</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#2D2A32]/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-[#2D2A32] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2A32] transition shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2D2A32] transition"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2A32] uppercase tracking-wider mb-1.5">
                  Student ID Proof <span className="text-slate-500 font-normal lowercase">(required)</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#2D2A32]/30 rounded-xl py-3.5 cursor-pointer bg-white/70 hover:bg-white transition shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2D2A32] mb-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-xs text-[#2D2A32] font-semibold">Upload photo of ID card</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                  />
                </label>
                {preview && (
                  <div className="mt-2 flex items-center gap-3 border border-[#2D2A32]/20 rounded-lg p-2 bg-white">
                    <img src={preview} alt="ID Preview" className="h-10 w-10 rounded object-cover" />
                    <div className="text-xs text-[#2D2A32] font-medium truncate">{idFile?.name}</div>
                  </div>
                )}
              </div>

              {loading && (
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-[#2D2A32] font-medium mb-1">
                    <span>Uploading ID...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#2D2A32] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D2A32] text-white font-bold tracking-wider py-3.5 rounded-xl hover:bg-[#3f3b46] active:scale-[0.99] disabled:opacity-50 transition shadow-lg mt-2"
              >
                {loading ? 'Submitting...' : 'Register Account'}
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  )
}

export default Register