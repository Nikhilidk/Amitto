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
    <>
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
    </>
  )
}

export default Register