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
  clearUnread: () => {}
})

// Owns the socket lifecycle: connects when a token exists, disconnects on logout,
// reconnects when a different user logs in. Also tracks the (in-memory) unread dot.
export function ChatProvider({ children }) {
  const { user, token, logout } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [unread, setUnread] = useState(() => new Set())

  const activeRef = useRef(null) // conversation currently open on screen
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

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('connect_error', onConnectError)
    s.on('inbox:update', onInboxUpdate)
    s.on('conversation:removed', onRemoved)

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

  const value = useMemo(() => ({
    socket,
    connected,
    connectError,
    hasUnread: unread.size > 0,
    isUnread: (id) => unread.has(id),
    setActiveConversation,
    clearUnread
  }), [socket, connected, connectError, unread, setActiveConversation, clearUnread])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  return useContext(ChatContext)
}