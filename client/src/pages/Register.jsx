import { useState } from 'react'
import { registerUser, getFriendlyErrorMessage } from '../api/apiService.js'

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [idFile, setIdFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      localStorage.setItem('token', result.token)
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

return (
  <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-sky-200 to-indigo-200 flex items-center justify-center p-4 sm:p-6 md:p-8">
    
    {/* Outer Photoframe Container with Glassmorphism Outline */}
    <div className="w-full max-w-5xl rounded-[32px] p-2 bg-white/30 backdrop-blur-md border border-white/60 shadow-2xl">
      
      {/* Inner Card Split Container */}
      <div className="bg-white rounded-[26px] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] shadow-inner">
        
        {/* LEFT SIDE: Hero Brand Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Background Glow Elements */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tagline */}
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">Campus Lost & Found</span>
            <h1 className="text-3xl font-black tracking-tight mt-1 text-white">AMITTO</h1>
            <p className="text-xs text-slate-400 mt-1 italic">You lost it? We found it!.</p>
          </div>

          {/* Center Visual Callout */}
          <div className="relative z-10 my-8">
            <h2 className="text-2xl font-bold leading-tight">
              Find, Post,<br />And help others.
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              A secure, student-verified space to report lost items and safely claim what's yours.
            </p>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-800 pt-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Verified Student Access Only</span>
          </div>
        </div>

        {/* RIGHT SIDE: Form Area */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Join the Community</h2>
              <p className="text-slate-500 text-sm mt-1">Create your account to browse & post items.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                <span>✅</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Full Name"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">College Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="student@college.edu"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student ID Proof <span className="text-slate-400 font-normal lowercase">(required)</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500 mb-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-xs text-slate-600 font-medium">Upload photo of ID card</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                  />
                </label>
                {preview && (
                  <div className="mt-2 flex items-center gap-3 border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <img src={preview} alt="ID Preview" className="h-10 w-10 rounded object-cover" />
                    <div className="text-xs text-slate-600 truncate">{idFile?.name}</div>
                  </div>
                )}
              </div>

              {loading && (
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading ID...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition shadow-md shadow-indigo-200 mt-2"
              >
                {loading ? 'Submitting...' : 'Register & Submit for Verification'}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>

  </div>
)
}

export default Register