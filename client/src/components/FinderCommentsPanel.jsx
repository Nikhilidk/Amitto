import { useState } from 'react'
import { Link } from 'react-router-dom'
import { acceptComment, declineComment, getCommentError } from '../api/apiService.js'

const unwrap = (d) => (d && d.comment ? d.comment : d) || {}

export default function FinderCommentsPanel({ comments, maxAccepted, postActive, onChanged, onRefresh }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const acceptedCount = comments.filter((c) => c.status === 'accepted').length
  const hasCap = typeof maxAccepted === 'number'
  const capReached = hasCap && acceptedCount >= maxAccepted

  const run = async (comment, action) => {
    setBusyId(comment._id)
    setError('')
    try {
      if (action === 'accept') {
        const data = await acceptComment(comment._id)
        onChanged(comment._id, {
          ...unwrap(data),
          status: 'accepted',
          conversation: data.conversationId ?? unwrap(data).conversation
        })
      } else {
        const data = await declineComment(comment._id)
        onChanged(comment._id, { ...unwrap(data), status: 'declined' })
      }
    } catch (err) {
      const { status, message } = getCommentError(err)
      setError(message)
      if (status === 409) onRefresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Finder comments</p>
        {hasCap && (
          <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
            {acceptedCount} of {maxAccepted} chats used
          </span>
        )}
      </div>

      {postActive && capReached && (
        <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          You’ve used all {maxAccepted} chats for this post, so you can’t accept more comments.
        </p>
      )}

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">No one has commented yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const author = c.author || c.finder || c.user || {}
            const name = author.name || 'Unknown'
            const busy = busyId === c._id
            const convoId = c.conversation?._id || c.conversation
            return (
              <li
                key={c._id}
                className={`bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-2 ${c.status === 'declined' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {author.photoUrl ? (
                    <img src={author.photoUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-[#D2A066]/30 flex items-center justify-center text-xs font-bold text-[#2D2A32]">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-[11px] text-gray-400">
                      {typeof author.trustScore === 'number' && <>⭐ {author.trustScore} · </>}
                      {c.createdAt ? new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  {c.status === 'declined' && <span className="text-[11px] text-gray-500">Declined</span>}
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-line">{c.text}</p>

                {postActive && c.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => run(c, 'accept')}
                      disabled={busy || capReached}
                      title={capReached ? `Chat limit reached (${maxAccepted})` : undefined}
                      className="text-xs font-medium bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? 'Working...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={() => run(c, 'decline')}
                      disabled={busy}
                      className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {c.status === 'accepted' && (
                  <Link
                    to={convoId ? `/messages/${convoId}` : '/messages'}
                    className="self-start text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    💬 Open chat
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}