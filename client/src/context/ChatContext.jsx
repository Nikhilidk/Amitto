import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { connectSocket, disconnectSocket } from '../api/socket.js'

const ChatContext = createContext({
  socket: null,
  connected: false,
  connectError: '',
  hasUnread: false,
  isUnread: () => false,
  setActiveConversation: () => {},
  clearUnread: () => {},
  isPostUnread: () => false,
  setActivePost: () => {},
  clearPostUnread: () => {}
})

// Owns the socket lifecycle: connects when a token exists, disconnects on logout,
// reconnects when a different user logs in. Also tracks the (in-memory) unread dot.
export function ChatProvider({ children }) {
  const { user, token, logout } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [unread, setUnread] = useState(() => new Set())
  // post ids with a new / updated finder comment (shares the same unread dot)
  const [commentUnread, setCommentUnread] = useState(() => new Set())

  const activeRef = useRef(null) // conversation currently open on screen
  const activePostRef = useRef(null) // post page currently open
  const userIdRef = useRef(null)
  const logoutRef = useRef(logout)
  useEffect(() => { userIdRef.current = user?.id }, [user])
  useEffect(() => { logoutRef.current = logout }, [logout])

  useEffect(() => {
    if (!token) {
      disconnectSocket()
      setSocket(null)
      setConnected(false)
      setConnectError('')
      setUnread(new Set())
      setCommentUnread(new Set())
      return
    }

    const s = connectSocket()
    setSocket(s)
    setConnected(s.connected)

    const onConnect = () => { setConnected(true); setConnectError('') }
    const onDisconnect = () => setConnected(false)

    // The server only checks the JWT during the handshake, so an expired token
    // shows up here on the next (re)connect. Treat it as a logout.
    const onConnectError = (err) => {
      setConnectError(err?.message || 'unknown error')
      if (/token|authentication/i.test(err?.message || '')) {
        s.disconnect()
        logoutRef.current()
      }
    }

    // Unread dot: a message from someone else for a chat that isn't open
    const onInboxUpdate = ({ conversationId, message } = {}) => {
      if (!conversationId || !message) return
      if (message.sender === userIdRef.current) return
      if (conversationId === activeRef.current) return
      setUnread((prev) => new Set(prev).add(conversationId))
    }

    const onRemoved = ({ conversationId } = {}) => {
      setUnread((prev) => {
        if (!prev.has(conversationId)) return prev
        const next = new Set(prev)
        next.delete(conversationId)
        return next
      })
    }

    // comment:new (poster) and comment:updated (finder). Assumes payload { postId }.
    // Payload is read as postId, post, or comment.post, since the server's shape may vary.
    const onCommentEvent = (payload = {}) => {
      const postId = payload.postId ?? payload.post ?? payload.comment?.post
      if (!postId) return
      const key = String(postId)
      if (key === activePostRef.current) return
      setCommentUnread((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
    }

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('connect_error', onConnectError)
    s.on('inbox:update', onInboxUpdate)
    s.on('conversation:removed', onRemoved)
    s.on('comment:new', onCommentEvent)
    s.on('comment:updated', onCommentEvent)

    return () => {
      disconnectSocket()
      setSocket(null)
      setConnected(false)
    }
  }, [token])

  const setActiveConversation = useCallback((id) => { activeRef.current = id }, [])

  const clearUnread = useCallback((id) => {
    setUnread((prev) => {
      if (!id || !prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const setActivePost = useCallback((id) => { activePostRef.current = id ? String(id) : null }, [])

  const clearPostUnread = useCallback((id) => {
    const key = id ? String(id) : null
    setCommentUnread((prev) => {
      if (!key || !prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const value = useMemo(() => ({
    socket,
    connected,
    connectError,
    hasUnread: unread.size > 0 || commentUnread.size > 0,
    isUnread: (id) => unread.has(id),
    setActiveConversation,
    clearUnread,
    isPostUnread: (id) => commentUnread.has(String(id)),
    setActivePost,
    clearPostUnread
  }), [socket, connected, connectError, unread, commentUnread, setActiveConversation, clearUnread, setActivePost, clearPostUnread])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  return useContext(ChatContext)
}