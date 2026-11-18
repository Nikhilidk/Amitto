import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import { formatTime } from './chatUtils.js'

export default function InboxList({ conversations, selectedId, currentUserId, isUnread, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
        <p className="text-xs">Loading chats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button onClick={onRetry} className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
          Try again
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 text-gray-400">
        <p className="text-sm font-medium text-gray-600 mb-1">No chats yet</p>
        <p className="text-xs">A chat opens when a claim on a found item is accepted.</p>
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
      {conversations.map((c) => {
        const last = c.lastMessage
        const preview = last
          ? `${last.sender === currentUserId ? 'You: ' : ''}${last.text}`
          : 'No messages yet'
        const unread = isUnread(c._id)
        return (
          <li key={c._id}>
            <Link
              to={`/messages/${c._id}`}
              className={`flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 ${selectedId === c._id ? 'bg-blue-50' : ''}`}
            >
              <Avatar user={c.other} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${unread ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                    {c.other?.name || 'Unknown'}
                  </p>
                  <span className="text-[11px] text-gray-400 shrink-0">{formatTime(c.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.post?.title || 'Deleted post'}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-xs truncate ${unread ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{preview}</p>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {c.status === 'closed' && (
                      <span className="text-[10px] font-semibold uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                        Closed
                      </span>
                    )}
                    {unread && <span className="w-2 h-2 rounded-full bg-blue-600" aria-label="Unread" />}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}