import { Outlet, useLocation } from 'react-router-dom'
import AuthFooter from '../components/AuthFooter.jsx'

const COPY = {
  '/login': {
    heading: <>Reconnecting items with their owners.</>,
    body: 'Log in to search through reported lost items, post found belongings, and connect securely with verified campus members.',
    label: 'Verified Student Access Network',
  },
  '/register': {
    heading: <>Find, Post,<br />And help others.</>,
    body: 'Join a verified campus community dedicated to returning lost items safely.',
    label: 'Verified Student Registration',
  },
}

function AuthLayout() {
  const { pathname } = useLocation()
  const copy = COPY[pathname] || COPY['/login']

  return (
    <div className="min-h-[calc(100vh-4.5rem)] w-full relative bg-[#F5EFE6] font-sans overflow-hidden">

      {/* Background (stays mounted across login/register) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D2A066]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-[#838A60]/20 rounded-full blur-3xl" />

        <svg
          className="absolute -top-6 -left-6 w-96 h-96 text-[#2D2A32]/[0.06] transform -rotate-12"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8a3 3 0 0 0-3 3" />
        </svg>

        <svg
          className="absolute -bottom-10 left-1/4 w-72 h-72 text-[#B85028]/[0.07] transform rotate-12"
          viewBox="0 0 24 24" fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 w-full min-h-[calc(100vh-4.5rem)] grid grid-cols-1 md:grid-cols-12">

        {/* LEFT PANEL: pinned to screen height so footer sits identically on both pages */}
        <div className="md:col-span-5 px-8 sm:px-12 py-8 sm:py-10 flex flex-col justify-between order-2 md:order-1 text-left md:sticky md:top-[4.5rem] md:self-start md:h-[calc(100vh-4.5rem)]">
          <div>
            <span className="text-xs font-black tracking-[0.25em] text-[#2D2A32]/70 uppercase block">
              Campus Lost & Found
            </span>
            <h1 className="text-5xl font-black text-[#2D2A32] tracking-tight mt-1">AMITTO</h1>
            <p className="text-sm font-serif italic text-[#2D2A32]/70 mt-1">
              You lost it? We found it!
            </p>
          </div>

          {/* Headline crossfades on route change */}
          <div key={pathname} className="auth-fade my-auto py-6 max-w-md">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#2D2A32] leading-[1.15] tracking-tight">
              {copy.heading}
            </h2>
            <p className="text-base text-[#2D2A32]/80 font-medium mt-4 leading-relaxed">
              {copy.body}
            </p>
          </div>

          <AuthFooter label={copy.label} />
        </div>

        {/* RIGHT PANEL: owns the divider so it spans the full height */}
        <div className="md:col-span-7 bg-white/70 backdrop-blur-md p-8 sm:p-16 flex flex-col justify-center order-1 md:order-2 shadow-xl text-left md:border-l border-[#2D2A32]/10">
          <div key={pathname} className="auth-fade max-w-md mx-auto w-full">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  )
}

export default AuthLayout