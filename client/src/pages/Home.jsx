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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Lost & Found Feed</h2>
          <p className="text-gray-500 text-sm mt-1">
            Browse items reported lost or found around campus.
          </p>
        </div>

        {user && isVerified && (
          <Link
            to="/create-post"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium text-center"
          >
            + Report an Item
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'lost', 'found'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
              filterType === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Loading posts...</p>
      )}

      {error && !loading && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <p className="text-gray-500 text-sm">No posts to show yet.</p>
      )}

      {!loading && !error && filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home