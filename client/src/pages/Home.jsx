import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getMyPosts, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard.jsx'
import { CATEGORIES, CAMPUS_ZONES } from '../constants.js'

function Home() {
  const { user, isVerified } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Filter state
  const [category, setCategory] = useState('')
  const [campusZone, setCampusZone] = useState('')
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [myPosts, setMyPosts] = useState([])

  // Debounce the search box (350ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 350)
    return () => clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    let isMounted = true

    async function fetchPosts() {
      try {
        setLoading(true)
        setError('')
        // Server-side filters ('all' / empty values are sent as undefined)
        const data = await getPosts({
          type: filterType === 'all' ? undefined : filterType,
          category: category || undefined,
          campusZone: campusZone || undefined,
          q: debouncedSearch.trim() || undefined
        })
        if (isMounted) setPosts(data)
      } catch (err) {
        if (isMounted) setError(getFriendlyErrorMessage(err))
      } finally {
        if (isMounted) setLoading(false)
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
    fetchMyPosts()
    return () => { isMounted = false }
  }, [user, filterType, category, campusZone, debouncedSearch])

  const filteredPosts = filterType === 'all'
    ? posts
    : posts.filter(p => p.type === filterType)

  const statusStyles = {
    active: 'bg-blue-100 text-blue-700',
    claim_pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-gray-200 text-gray-600'
  }

  const hasActiveFilters =
    filterType !== 'all' || category !== '' || campusZone !== '' || searchText.trim() !== ''

  const clearFilters = () => {
    setFilterType('all')
    setCategory('')
    setCampusZone('')
    setSearchText('')
    setDebouncedSearch('')
  }

  const selectClass =
    'flex-1 min-w-[140px] px-3 py-2 rounded-lg text-sm bg-white text-[#2D2A32] border border-[#2D2A32]/10 focus:outline-none focus:ring-2 focus:ring-[#D2A066]/50'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

        {/* LEFT — Main Feed */}
        <main className="order-1">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black tracking-tight text-[#2D2A32]">AMITTO</h2>
            <p className="text-[#2D2A32]/60 text-sm mt-1">
              A community-based lost and found website to help and support students, faculty and staff helpers.
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

          {/* Search box */}
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="🔍 Search by title or description..."
            className="w-full px-4 py-2.5 mb-4 rounded-lg text-sm bg-white text-[#2D2A32] border border-[#2D2A32]/10 focus:outline-none focus:ring-2 focus:ring-[#D2A066]/50"
          />

          {/* Category + Campus zone dropdowns */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              className={selectClass}
            >
              <option value="">All campus zones</option>
              {CAMPUS_ZONES.map(z => (
                <option key={z} value={z}>
                  {z === 'unspecified' ? 'Unspecified Zone' : z}
                </option>
              ))}
            </select>
          </div>

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

          {!loading && !error && filteredPosts.length === 0 && !hasActiveFilters && (
            <p className="text-[#2D2A32]/50 text-sm text-center py-12">No posts to show yet.</p>
          )}

          {!loading && !error && filteredPosts.length === 0 && hasActiveFilters && (
            <div className="text-center py-12">
              <p className="text-[#2D2A32]/60 text-sm mb-3">No posts match your filters.</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-full text-sm font-medium bg-[#2D2A32] text-white hover:opacity-90 transition"
              >
                Clear filters
              </button>
            </div>
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
        <aside className="order-2">
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