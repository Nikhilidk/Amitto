export default function Avatar({ user, size = 'w-10 h-10' }) {
  const name = user?.name || 'User'
  if (user?.photoUrl) {
    return <img src={user.photoUrl} alt={name} className={`${size} rounded-full object-cover shrink-0`} />
  }
  return (
    <span className={`${size} rounded-full bg-[#D2A066]/30 flex items-center justify-center text-sm font-bold text-[#2D2A32] shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}