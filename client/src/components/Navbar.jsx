import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {useChat} from '../context/ChatContext.jsx';


function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#2D2A32] text-[#F5EFE6] px-6 py-4 shadow-md border-b border-[#2D2A32]/10 sticky top-0 z-50 backdrop-blur-md bg-opacity-95 flex justify-between items-center font-sans">
      
      {/* Brand Section */}
      <Link to="/" className="flex items-center gap-2 group">
        <span className="text-xl font-black tracking-tight text-[#F5EFE6] group-hover:text-[#D2A066] transition">
          AMITTO
        </span>
        <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-[#F5EFE6]/60 border-l border-[#F5EFE6]/20 pl-2">
          Lost & Found
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
        {user && (
          <Link 
            to="/" 
            className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition"
          >
            Home
          </Link>
        )}

        {!user && (
          <div className="flex items-center gap-3">
            <Link 
              to="/register" 
              className="bg-[#F5EFE6] text-[#2D2A32] hover:bg-[#e8decb] px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Register
            </Link>
            <Link 
              to="/login" 
              className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              Login
            </Link>
          </div>
        )}

        {user && (
          <>
            <Link 
              to="/create-post" 
              className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition"
            >
              Create Post
            </Link>

            {/* Profile Navigation Link */}
            <Link 
              to="/profile" 
              className="flex items-center gap-2 text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition"
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-[#F5EFE6]/30 shadow-sm"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-[#D2A066] text-[#2D2A32] flex items-center justify-center text-xs font-black border border-[#F5EFE6]/20">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </>
        )}

        {user && isAdmin && (
          <Link 
            to="/admin" 
            className="bg-[#D2A066]/20 text-[#D2A066] border border-[#D2A066]/40 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-[#D2A066]/30 transition"
          >
            Admin Panel
          </Link>
        )}

        {user && (
          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-xl transition text-xs font-bold"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;