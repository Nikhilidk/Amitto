import { io } from 'socket.io-client'
import { CONFIG } from './apiService.js'

// Same lookup apiService uses, so the socket always carries the current session token
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token')

let socket = null

// One shared socket for the whole app. `auth` is a function, so every
// reconnect attempt re-reads the token instead of reusing a stale one.
export function connectSocket() {
  if (socket) return socket
  socket = io(CONFIG.SOCKET_URL, {
    auth: (cb) => cb({ token: getToken() }),
    reconnectionDelayMax: 5000
  })
  return socket
}

export function disconnectSocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}

export const getSocket = () => socket