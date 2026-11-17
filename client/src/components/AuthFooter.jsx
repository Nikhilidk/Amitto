const TEAM = [
  {
    name: 'Nikhil Negi',
    email: 'nikhil.idk@gmail.com',
    linkedin: 'https://www.linkedin.com/in/nikhil-negi-ba5076403',
  },
  {
    name: 'Sanyam Baranwal',
    email: 'bsanyam2006@gmail.com',
    linkedin: 'https://www.linkedin.com/in/sanyam-baranwal-227794305',
  },
  {
    name: 'Ausaaf Siddiqui',
    email: 'ausaafsidddiquisrmu.04@gmail.com',
    linkedin: 'https://www.linkedin.com/in/ausaaf-siddiqui-5059b8355',
  },
]

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
)

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

function AuthFooter({ label }) {
  return (
    <div className="bg-[#2D2A32] text-[#F5EFE6] rounded-2xl p-5 shadow-lg">
      {/* Label now lives inside the black box */}
      {label && (
        <div className="text-xs font-bold tracking-widest text-[#F5EFE6]/70 uppercase pb-3 mb-3 border-b border-[#F5EFE6]/10">
          {label}
        </div>
      )}

      <p className="text-[10px] font-black tracking-[0.25em] text-[#D2A066] uppercase mb-3">
        Contact the Team
      </p>

      <ul className="space-y-1.5">
        {TEAM.map((member) => (
          <li key={member.email} className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">{member.name}</span>
            <div className="flex items-center gap-1">
              <a
                href={`mailto:${member.email}`}
                title={member.email}
                aria-label={`Email ${member.name}`}
                className="p-1.5 rounded-lg text-[#F5EFE6]/60 hover:text-[#D2A066] hover:bg-[#F5EFE6]/10 transition"
              >
                <MailIcon />
              </a>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                title={`${member.name} on LinkedIn`}
                aria-label={`${member.name} on LinkedIn`}
                className="p-1.5 rounded-lg text-[#F5EFE6]/60 hover:text-[#D2A066] hover:bg-[#F5EFE6]/10 transition"
              >
                <LinkedInIcon />
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] font-medium text-[#F5EFE6]/50 mt-4 pt-3 border-t border-[#F5EFE6]/10">
        © {new Date().getFullYear()} Amitto. All rights reserved.
      </p>
    </div>
  )
}

export default AuthFooter