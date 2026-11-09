import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMyConversations, getFriendlyErrorMessage } from '../api/apiService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useChat } from '../context/ChatContext.jsx'
import InboxList from '../components/chat/InboxList.jsx'
import ChatView from '../components/chat/ChatView.jsx'
import { sortByActivity } from '../components/chat/chatUtils.js'

export default function Messages() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { socket, connected, connectError, setActiveConversation, clearUnread, isUnread } = useChat()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const convsRef = useRef([])

  useEffect(() => { convsRef.current = conversations }, [conversations])

  const loadInbox = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError('')
      const data = await getMyConversations()
      setConversations(sortByActivity(data))
    } catch (err) {
      if (err.response?.status === 401) return logout()
      if (!silent) setError(getFriendlyErrorMessage(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [logout])

  useEffect(() => { loadInbox() }, [loadInbox])

  // Tell the context which chat is open (no unread dot for it) and clear its dot
  useEffect(() => {
    setActiveConversation(id || null)
    if (id) {
      clearUnread(id)
      setNotice('')
    }
    return () => setActiveConversation(null)
  }, [id, setActiveConversation, clearUnread])

  // Live inbox events
  useEffect(() => {
    if (!socket) return

    const onInboxUpdate = ({ conversationId, message } = {}) => {
      const known = convsRef.current.some((c) => c._id === conversationId)
      if (!known) return loadInbox(true)
      setConversations((prev) =>
        sortByActivity(
          prev.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  lastMessage: { text: message.text, sender: message.sender, createdAt: message.createdAt },
                  lastMessageAt: message.createdAt
                }
              : c
          )
        )
      )
    }

    const onCreated = () => loadInbox(true)

    const onClosed = ({ conversationId } = {}) => {
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? { ...c, status: 'closed' } : c)))
    }

    const onRemoved = ({ conversationId } = {}) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId))
      if (conversationId === id) {
        setNotice('This conversation is no longer available')
        navigate('/messages', { replace: true })
      }
    }

    // Reconnect: we may have missed events, so resync the list
    const onConnect = () => loadInbox(true)

    socket.on('inbox:update', onInboxUpdate)
    socket.on('conversation:created', onCreated)
    socket.on('conversation:closed', onClosed)
    socket.on('conversation:removed', onRemoved)
    socket.on('connect', onConnect)
    return () => {
      socket.off('inbox:update', onInboxUpdate)
      socket.off('conversation:created', onCreated)
      socket.off('conversation:closed', onClosed)
      socket.off('conversation:removed', onRemoved)
      socket.off('connect', onConnect)
    }
  }, [socket, id, navigate, loadInbox])

  const selected = conversations.find((c) => c._id === id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[calc(100dvh-6rem)] min-h-[420px]">

        {/* Inbox: always visible on desktop, hidden on mobile while a chat is open */}
        <aside className={`${id ? 'hidden md:flex' : 'flex'} w-full md:w-80 md:border-r border-gray-100 flex-col min-h-0`}>
          <div className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900">Messages</h1>
            {!connected && (
              <p className="text-[11px] text-amber-600 mt-0.5">
                Connecting...{connectError ? ` (${connectError})` : ''}
              </p>
            )}
          </div>
          {notice && !id && (
            <p className="mx-3 mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2" role="status">
              {notice}
            </p>
          )}
          <InboxList
            conversations={conversations}
            selectedId={id}
            currentUserId={user?.id}
            isUnread={isUnread}
            loading={loading}
            error={error}
            onRetry={() => loadInbox()}
          />
        </aside>

        {/* Chat pane */}
        <section className={`${id ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 min-h-0`}>
          {id ? (
            <ChatView
              key={id}
              conversationId={id}
              conversation={selected}
              currentUserId={user?.id}
              socket={socket}
              onBack={() => navigate('/messages')}
              onAuthError={logout}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-gray-400 px-6">
              {notice || 'Select a conversation to start chatting'}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}