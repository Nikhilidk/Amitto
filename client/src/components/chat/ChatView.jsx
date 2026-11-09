import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMessages, sendMessage, getFriendlyErrorMessage } from '../../api/apiService.js'
import Avatar from './Avatar.jsx'
import { mergeMessages, formatTime } from './chatUtils.js'

const MAX_LENGTH = 1000

export default function ChatView({ conversationId, conversation, currentUserId, socket, onBack, onAuthError }) {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState(conversation?.status || null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const listRef = useRef(null)
  const stickRef = useRef(true)     // auto-scroll only while the user is near the bottom
  const prependRef = useRef(null)   // scroll bookkeeping when older messages are added on top
  const messagesRef = useRef([])
  const onAuthErrorRef = useRef(onAuthError)

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { onAuthErrorRef.current = onAuthError }, [onAuthError])

  // Join the room, load the latest page, and wire live events.
  // `sync` runs on open AND on every socket (re)connect: rooms are lost on
  // reconnect and messages may have been missed, so we re-join and refetch.
  useEffect(() => {
    let active = true

    const sync = async (initial) => {
      if (socket) {
        const res = await new Promise((resolve) => {
          socket.timeout(8000).emit('conversation:join', conversationId, (err, r) => resolve(err ? null : r))
        })
        if (!active) return
        if (res?.error) {
          setUnavailable(true)
          setLoading(false)
          return
        }
      }

      try {
        const data = await getMessages(conversationId, { limit: 50 })
        if (!active) return
        setStatus(data.status)
        setLoadError('')

        const current = messagesRef.current
        const overlaps =
          initial ||
          current.length === 0 ||
          data.messages.some((m) => current.some((c) => c._id === m._id))

        if (!overlaps && data.hasMore) {
          // Missed more than a page while offline: start over from the latest page
          setMessages(data.messages)
          setHasMore(true)
        } else {
          setMessages((prev) => mergeMessages(prev, data.messages))
          if (initial || current.length === 0) setHasMore(data.hasMore)
        }
      } catch (err) {
        if (!active) return
        const code = err.response?.status
        if (code === 401) onAuthErrorRef.current?.()
        else if (code === 404 || code === 400) setUnavailable(true)
        else setLoadError(getFriendlyErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    sync(true)

    const onNew = (message) => {
      if (message?.conversation !== conversationId) return
      setMessages((prev) => mergeMessages(prev, [message])) // dedupes against the send ack
    }
    const onClosed = ({ conversationId: id } = {}) => {
      if (id === conversationId) setStatus('closed')
    }
    const onConnect = () => sync(false)

    if (socket) {
      socket.on('message:new', onNew)
      socket.on('conversation:closed', onClosed)
      socket.on('connect', onConnect)
    }

    return () => {
      active = false
      if (socket) {
        socket.off('message:new', onNew)
        socket.off('conversation:closed', onClosed)
        socket.off('connect', onConnect)
        if (socket.connected) socket.emit('conversation:leave', conversationId)
      }
    }
  }, [conversationId, socket])

  // Scrolling: keep position when older messages are prepended, else stick to bottom
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    if (prependRef.current != null) {
      el.scrollTop = el.scrollHeight - prependRef.current
      prependRef.current = null
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, loading])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const loadOlder = async () => {
    if (loadingOlder || messages.length === 0) return
    setLoadingOlder(true)
    try {
      const data = await getMessages(conversationId, { before: messages[0]._id })
      const el = listRef.current
      if (el) prependRef.current = el.scrollHeight - el.scrollTop
      setMessages((prev) => mergeMessages(prev, data.messages))
      setHasMore(data.hasMore)
    } catch (err) {
      if (err.response?.status === 401) onAuthErrorRef.current?.()
      else setLoadError(getFriendlyErrorMessage(err))
    } finally {
      setLoadingOlder(false)
    }
  }

  // Socket send with ack; REST fallback if the socket is down
  const deliver = (body) => {
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        socket.timeout(8000).emit('message:send', { conversationId, text: body }, (err, res) => {
          if (err) return reject({ message: 'Message timed out. Please try again.' })
          if (res?.error) return reject({ message: res.error, status: res.status })
          resolve(res.message)
        })
      })
    }
    return sendMessage(conversationId, body)
      .then((data) => data.message)
      .catch((err) => {
        throw { message: getFriendlyErrorMessage(err), status: err.response?.status }
      })
  }

  const handleSend = async () => {
    const body = text.trim()
    if (!body || sending || status === 'closed') return
    setSending(true)
    setSendError('')
    stickRef.current = true
    try {
      const message = await deliver(body)
      setMessages((prev) => mergeMessages(prev, [message]))
      setText('')
    } catch (err) {
      if (err.status === 409) {
        setStatus('closed')            // read-only now
        setSendError('')
      } else if (err.status === 404) {
        setUnavailable(true)
      } else {
        setSendError(err.message || 'Could not send message.')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (unavailable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <p className="text-sm font-medium text-gray-700 mb-3">This conversation is no longer available</p>
        <button onClick={onBack} className="text-xs font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          Back to inbox
        </button>
      </div>
    )
  }

  const closed = status === 'closed'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="md:hidden text-gray-500 hover:text-gray-800 text-sm font-medium" aria-label="Back to inbox">
          ←
        </button>
        <Avatar user={conversation?.other} size="w-9 h-9" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{conversation?.other?.name || 'Chat'}</p>
          {conversation?.post && (
            <Link to={`/posts/${conversation.post._id}`} className="text-xs text-gray-500 hover:underline truncate block">
              {conversation.post.title}
            </Link>
          )}
        </div>
        {closed && (
          <span className="text-[10px] font-semibold uppercase bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Closed
          </span>
        )}
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-gray-50">
          {hasMore && (
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="self-center text-xs font-medium text-blue-600 hover:underline disabled:opacity-50 mb-2"
            >
              {loadingOlder ? 'Loading...' : 'Load older messages'}
            </button>
          )}

          {loadError && <p className="text-xs text-red-600 text-center">{loadError}</p>}

          {messages.length === 0 && !loadError && (
            <p className="text-sm text-gray-400 text-center my-auto">No messages yet. Say hello!</p>
          )}

          {messages.map((m) => {
            const mine = m.sender === currentUserId
            return (
              <div key={m._id} className={`flex flex-col max-w-[80%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatTime(m.createdAt)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Composer */}
      {closed ? (
        <p className="px-4 py-3 text-sm text-gray-500 bg-gray-50 border-t border-gray-100 text-center">
          This conversation is closed. The item was resolved, so messages are read-only.
        </p>
      ) : (
        <div className="border-t border-gray-100 p-3 flex flex-col gap-2">
          {sendError && <p className="text-xs text-red-600" role="alert">{sendError}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_LENGTH}
              rows={2}
              placeholder="Type a message..."
              className="flex-1 resize-none px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <span className={`text-[11px] self-end ${text.length >= MAX_LENGTH - 50 ? 'text-red-500' : 'text-gray-400'}`}>
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  )
}