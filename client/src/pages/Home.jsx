import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getMyPosts, getLeaderboard, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard.jsx'

function Home() {
  const { user, isVerified } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('all')

  const [leaderboard, setLeaderboard] = useState([])
  const [myPosts, setMyPosts] = useState([])

  useEffect(() => {
    let isMounted = true

    async function fetchPosts() {
      try {
        setLoading(true)
        const data = await getPosts()
        if (isMounted) setPosts(data)
      } catch (err) {
        if (isMounted) setError(getFriendlyErrorMessage(err))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    async function fetchLeaderboard() {
      try {
        const data = await getLeaderboard()
        if (isMounted) setLeaderboard(data)
      } catch (err) {
        // fail silently — sidebar is non-critical
      }
    }

    async function fetchMyPosts() {
      if (!user) return
      try {
        const data = await getMyPosts()
        if (isMounted) setMyPosts(data)
      } catch (err) {
        // fail silently — sidebar is non-critical
      }
    }

    fetchPosts()
    fetchLeaderboard()
    fetchMyPosts()
    return () => { isMounted = false }
  }, [user])

  const filteredPosts = filterType === 'all'
    ? posts
    : posts.filter(p => p.type === filterType)

  const statusStyles = {
    active: 'bg-blue-100 text-blue-700',
    claim_pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-gray-200 text-gray-600'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-6">

        {/* LEFT SIDEBAR — Trust Score Leaderboard */}
        <aside className="order-2 lg:order-1">
          <div className="bg-white rounded-2xl border border-[#2D2A32]/10 shadow-sm p-5 sticky top-20">
            <h3 className="text-sm font-bold text-[#2D2A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              🏆 Top Contributors
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-[#2D2A32]/50">No data yet.</p>
            ) : (
              <ul className="space-y-3">
                {leaderboard.map((u, i) => (
                  <li key={u._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#2D2A32]/40 w-4">{i + 1}</span>
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#D2A066]/30 flex items-center justify-center text-xs font-bold text-[#2D2A32]">
                        {u.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2D2A32] truncate">{u.name}</p>
                      <p className="text-[10px] text-[#2D2A32]/50">⭐ {u.trustScore} pts</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* CENTER — Main Feed */}
        <main className="order-1 lg:order-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#2D2A32]">Lost & Found Feed</h2>
            <p className="text-[#2D2A32]/60 text-sm mt-1">
              Browse items reported lost or found around campus.
            </p>
          </div>

          {user && isVerified && (
            <Link
              to="/create-post"
              className="flex items-center gap-4 bg-white rounded-2xl border border-[#2D2A32]/10 shadow-sm hover:shadow-md transition px-5 py-4 mb-6"
            >
              <span className="w-11 h-11 rounded-full bg-[#D2A066]/20 text-[#D2A066] flex items-center justify-center text-xl font-bold shrink-0">
                +
              </span>
              <span className="text-[#2D2A32]/40 text-sm">Report a lost or found item...</span>
            </Link>
          )}

          <div className="flex gap-2 mb-6">
            {['all', 'lost', 'found'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
                  filterType === t
                    ? 'bg-[#2D2A32] text-white'
                    : 'bg-white text-[#2D2A32]/60 border border-[#2D2A32]/10 hover:bg-[#2D2A32]/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loading && (
            <p className="text-[#2D2A32]/50 text-sm text-center py-8">Loading posts...</p>
          )}

          {error && !loading && (
            <p className="text-red-600 text-sm text-center py-8">{error}</p>
          )}

          {!loading && !error && filteredPosts.length === 0 && (
            <p className="text-[#2D2A32]/50 text-sm text-center py-12">No posts to show yet.</p>
          )}

          {!loading && !error && filteredPosts.length > 0 && (
            <div className="flex flex-col gap-6">
              {filteredPosts.map(post => (
                <div key={post._id} className="bg-white rounded-2xl border border-[#2D2A32]/10 shadow-sm hover:shadow-md transition overflow-hidden">
                  <Link to={`/posts/${post._id}`} className="block">
                    <PostCard post={post} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR — Your Recent Post Status */}
        <aside className="order-3">
          <div className="bg-white rounded-2xl border border-[#2D2A32]/10 shadow-sm p-5 sticky top-20">
            <h3 className="text-sm font-bold text-[#2D2A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              📋 Your Recent Updates
            </h3>
            {!user ? (
              <p className="text-xs text-[#2D2A32]/50">Log in to see your post updates.</p>
            ) : myPosts.length === 0 ? (
              <p className="text-xs text-[#2D2A32]/50">No updates yet — you haven't posted anything.</p>
            ) : (
              <ul className="space-y-3">
                {myPosts.slice(0, 5).map(p => (
                  <li key={p._id} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#2D2A32] truncate">{p.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusStyles[p.status] || ''}`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

      </div>
    </div>
  )
}

export default Home