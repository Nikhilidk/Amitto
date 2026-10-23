import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getPostById, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'
import DeleteButton from '../components/DeleteButton.jsx'

const statusStyles = {
  active: 'bg-blue-100 text-blue-700',
  claim_pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-gray-200 text-gray-600'
}

function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isVerified } = useAuth()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Delete failures show inline under the buttons (`error` would replace the whole page)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchPost() {
      try {
        setLoading(true)
        setError('')
        setNotFound(false)
        const data = await getPostById(id)
        console.log('getPostById returned:', data)
        if (isMounted) setPost(data.post || data)
      } catch (err) {
        if (!isMounted) return
        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(getFriendlyErrorMessage(err))
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPost()
    return () => { isMounted = false }
  }, [id])

  const backLink = (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition mb-4"
    >
      ← Back to feed
    </Link>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading post...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {backLink}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Post not found</h2>
          <p className="text-sm text-gray-500">
            This post may have been deleted or the link is incorrect.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {backLink}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {backLink}
        <p className="text-sm text-gray-500 text-center py-12">Couldn't load this post.</p>
      </div>
    )
  }

  const { type, title, description, photoUrl, category, campusZone, status, postedBy, createdAt } = post

  const typeStyles = type === 'lost'
    ? 'bg-red-100 text-red-700'
    : 'bg-green-100 text-green-700'

  const posterName = postedBy?.name || 'Unknown'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {backLink}

      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <img
          src={photoUrl}
          alt={title}
          className="w-full max-h-[480px] object-cover bg-gray-100"
        />

        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${typeStyles}`}>
              {type}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}>
              {status?.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="bg-gray-100 px-2.5 py-1 rounded-full">📂 {category || 'Other'}</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded-full">📍 {campusZone || 'Unspecified'}</span>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {description}
          </p>

          {/* Poster + date */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {postedBy?.photoUrl ? (
                <img
                  src={postedBy.photoUrl}
                  alt={posterName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-[#D2A066]/30 flex items-center justify-center text-sm font-bold text-[#2D2A32]">
                  {posterName.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{posterName}</p>
                <p className="text-xs text-gray-400">Posted by</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : ''}
            </span>
          </div>

          {/* Action area */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={!isVerified}
                onClick={() => { /* claim flow goes here in the next feature */ }}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Claim this item
              </button>

              <DeleteButton
                post={post}
                label="Delete post"
                className="w-full sm:w-auto px-6 py-2.5 text-sm"
                onStart={() => setDeleteError('')}
                onDeleted={() => navigate('/', { replace: true })}
                onError={setDeleteError}
              />
            </div>

            {!isVerified && (
              <p className="text-xs text-gray-400 mt-2">
                Only verified users can claim items.
              </p>
            )}

            {deleteError && (
              <p className="text-sm text-red-600 mt-3" role="alert">{deleteError}</p>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

export default PostDetail