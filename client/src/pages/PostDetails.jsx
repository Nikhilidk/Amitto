import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getPostById, claimPost, getClaimError, getFriendlyErrorMessage, getConversationByPost } from '../api/apiService.js'
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
  const { user, isVerified } = useAuth()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Delete failures show inline under the buttons (`error` would replace the whole page)
  const [deleteError, setDeleteError] = useState('')

  // Claim box state
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [claimFeedback, setClaimFeedback] = useState(null) // { type: 'success' | 'error', text }
  const [lockedOut, setLockedOut] = useState(false)
  const [conversationId, setConversationId]=useState(null)

  // silent = refetch without the full-page spinner (used after a 409)
  const loadPost = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      setError('')
      setNotFound(false)
      const data = await getPostById(id)
      setPost(data.post || data)
    } catch (err) {
      if (silent) return
      if (err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError(getFriendlyErrorMessage(err))
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setAnswer('')
    setClaimFeedback(null)
    setLockedOut(false)
    setConversationId(null)
    loadPost()
  }, [loadPost])

  // find the chat for the owner / accepted claimant.
  useEffect(() => {
    if (!post || !user || post.type !== 'found' || conversationId) return
    const ownerId = post.postedBy && typeof post.postedBy === 'object' ? post.postedBy._id : post.postedBy
    const hasChat = post.status === 'claim_pending' || post.status === 'resolved'
    if (!hasChat || !(user.id === ownerId || post.claimedByMe)) return

    let cancelled = false
    getConversationByPost(post._id)
      .then((d) => { if (!cancelled) setConversationId(d.conversationId) })
      .catch(() => {}) // no chat (e.g. resolved without a claim): just no button
    return () => { cancelled = true }
  }, [post, user, conversationId])


  const handleClaim = async (e) => {
    e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed) {
      setClaimFeedback({ type: 'error', text: 'Please enter your answer.' })
      return
    }

    setSubmitting(true)
    setClaimFeedback(null)
    try {
      const data = await claimPost(post._id, trimmed)
      // 200: update the post in state (GET /:id only gives claimedByMe, never claimedBy)
      setPost((prev) => ({ ...prev, status: 'claim_pending', claimedByMe: true }))
      setAnswer('')
      setClaimFeedback({ type: 'success', text: 'Claim accepted. The owner will contact you.' })
    } catch (err) {
      const { status, message, attemptsLeft } = getClaimError(err)

      if (status === 429 || (status === 403 && attemptsLeft === 0)) {
        // Locked out: hide the form
        setLockedOut(true)
        setClaimFeedback(null)
      } else if (status === 403 && typeof attemptsLeft === 'number') {
        setClaimFeedback({
          type: 'error',
          text: `Incorrect answer, ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`
        })
      } else if (status === 409) {
        setClaimFeedback({ type: 'error', text: 'This item is no longer available' })
        loadPost({ silent: true })
      } else {
        setClaimFeedback({ type: 'error', text: message })
      }
    } finally {
      setSubmitting(false)
    }
  }

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

  const { type, title, description, photoUrl, category, campusZone, status, postedBy, createdAt, claimQuestion, claimedByMe } = post

  const typeStyles = type === 'lost'
    ? 'bg-red-100 text-red-700'
    : 'bg-green-100 text-green-700'

  const posterName = postedBy?.name || 'Unknown'

  // Claim box logic (found posts only)
  const isFound = type === 'found'
  const ownerId = postedBy && typeof postedBy === 'object' ? postedBy._id : postedBy
  const isOwner = Boolean(user?.id) && user.id === ownerId

  const claimBoxVisible = isFound && status === 'active' && Boolean(user) && isVerified && !isOwner

  // Message under the claim area, depending on the situation
  let statusNote = null
  if (isFound && status === 'claim_pending') {
    if (claimedByMe) {
      // The success message already says this right after claiming
      statusNote = claimFeedback?.type === 'success'
        ? null
        : 'Your claim was accepted. You can chat with the owner now.'
    } else {
      statusNote = 'A claim is pending for this item.'
    }
  } else if (isFound && status === 'resolved') {
    statusNote = 'This item has been resolved.'
  }

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
          <div className="pt-2 flex flex-col gap-4">

            {/* Claim box: found + active, logged in, verified, not the owner */}
            {claimBoxVisible && (
              !claimQuestion ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                  This item can't be claimed online.
                </p>
              ) : lockedOut ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
                  No attempts left for this item
                </p>
              ) : (
                <form onSubmit={handleClaim} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Is this your item? Answer the owner's question
                  </p>
                  <p className="text-sm font-medium text-gray-900">{claimQuestion}</p>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={100}
                    placeholder="Your answer"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Checking...' : 'Claim this item'}
                  </button>
                </form>
              )
            )}

            {/* Logged out */}
            {isFound && status === 'active' && !user && (
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-blue-600 font-medium hover:underline">Log in to claim</Link>
                {' '}this item.
              </p>
            )}

            {/* Logged in but not verified */}
            {isFound && status === 'active' && user && !isVerified && !isOwner && (
              <p className="text-xs text-gray-400">
                Only verified users can claim items.
              </p>
            )}

            {/* Result of the last claim attempt */}
            {claimFeedback && (
              <p
                className={`text-sm rounded-xl px-4 py-3 ${
                  claimFeedback.type === 'success'
                    ? 'text-green-700 bg-green-50 border border-green-100'
                    : 'text-red-600 bg-red-50 border border-red-100'
                }`}
                role={claimFeedback.type === 'success' ? 'status' : 'alert'}
              >
                {claimFeedback.text}
                {/* link straight to the chat after a successful claim */}
                {claimFeedback.type === 'success' && conversationId && (
                  <Link to={`/messages/${conversationId}`} className="ml-2 font-semibold underline">
                    Open chat →
                  </Link>
                )}
              </p>
            )}

            {/* claim_pending / resolved note */}
            {statusNote && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                {statusNote}
              </p>
            )}

            {/* Message button for the owner and the accepted claimant */}
            {conversationId && (isOwner || claimedByMe) && (
              <Link
                to={`/messages/${conversationId}`}
                className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                💬 {status === 'resolved' ? 'View chat' : isOwner ? 'Message claimant' : 'Message owner'}
              </Link>
            )}

            {/* Delete (renders nothing unless owner or admin) */}
            <div className="empty:hidden">
              <DeleteButton
                post={post}
                label="Delete post"
                className="w-full sm:w-auto px-6 py-2.5 text-sm"
                onStart={() => setDeleteError('')}
                onDeleted={() => navigate('/', { replace: true })}
                onError={setDeleteError}
              />
            </div>

            {deleteError && (
              <p className="text-sm text-red-600" role="alert">{deleteError}</p>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

export default PostDetail