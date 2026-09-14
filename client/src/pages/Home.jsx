import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard.jsx'

function Home() {
  const { user, isVerified } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'lost' | 'found'

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

    fetchPosts()
    return () => { isMounted = false }
  }, [])

  const filteredPosts = filterType === 'all'
    ? posts
    : posts.filter(p => p.type === filterType)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Amitto</h2>
        <p className="text-gray-500 text-sm mt-1">
          Browse items reported lost or found around campus.
        </p>
      </div>

      {/* Quick action bar — "Start a post" style */}
      {user && isVerified && (
        <Link
          to="/create-post"
          className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition px-5 py-4 mb-6"
        >
          <span className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold shrink-0">
            +
          </span>
          <span className="text-gray-400 text-sm">Report a lost or found item...</span>
        </Link>
      )}

      {/* Filter tabs */}
<div className="flex gap-2 mb-6">
  {['all', 'lost', 'found'].map(t => (
    <button
      key={t}
      onClick={() => setFilterType(t)}
      className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
        filterType === t
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {t}
    </button>
  ))}
</div>

      {/* States */}
      {loading && (
        <p className="text-gray-500 text-sm text-center py-8">Loading posts...</p>
      )}

      {error && !loading && (
        <p className="text-red-600 text-sm text-center py-8">{error}</p>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12">No posts to show yet.</p>
      )}

      {/* Feed — single centered column, bigger cards */}
      {!loading && !error && filteredPosts.length > 0 && (
        <div className="flex flex-col gap-6">
          {filteredPosts.map(post => (
            <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home