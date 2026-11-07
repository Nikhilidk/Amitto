const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ChatError, getParticipantConversation, createMessage } = require('./utils/chat');

const convRoom = (conversationId) => `conv:${conversationId}`;
const userRoom = (userId) => `user:${userId}`;

// Mongoose docs / ObjectIds -> plain JSON-safe objects
const plain = (doc) => JSON.parse(JSON.stringify(doc));

// Live message to the open chat, plus an inbox nudge to both users
const broadcastMessage = (io, conversation, message) => {
  if (!io) return;
  const payload = plain(message);
  io.to(convRoom(conversation._id)).emit('message:new', payload);
  io.to(userRoom(conversation.owner.toString()))
    .to(userRoom(conversation.claimant.toString()))
    .emit('inbox:update', { conversationId: conversation._id.toString(), message: payload });
};

const emitToParticipants = (io, conversation, event) => {
  io.to(userRoom(conversation.owner.toString()))
    .to(userRoom(conversation.claimant.toString()))
    .emit(event, { conversationId: conversation._id.toString(), postId: conversation.post.toString() });
};

// A claim was accepted: tell both users a chat exists
const notifyConversationCreated = (io, conversation) => {
  if (io && conversation) emitToParticipants(io, conversation, 'conversation:created');
};

// Resolved: chat becomes read-only
const notifyConversationClosed = (io, conversation) => {
  if (io && conversation) emitToParticipants(io, conversation, 'conversation:closed');
};

// Rejected claim or deleted post: chat is gone, kick everyone out of the room
const notifyConversationRemoved = (io, conversation) => {
  if (!io || !conversation) return;
  emitToParticipants(io, conversation, 'conversation:removed');
  io.in(convRoom(conversation._id)).socketsLeave(convRoom(conversation._id));
};

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*' },
  });

  // Handshake auth: no valid token, no connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.userId;

    // Personal room: inbox updates and chat lifecycle events arrive here
    socket.join(userRoom(userId));

    // Join a chat room (participants only)
    socket.on('conversation:join', async (conversationId, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (typeof conversationId !== 'string') return reply({ error: 'Conversation not found' });
        const conversation = await getParticipantConversation(conversationId, userId);
        if (!conversation) return reply({ error: 'Conversation not found' });

        socket.join(convRoom(conversation._id));
        reply({ ok: true, status: conversation.status });
      } catch (err) {
        console.error('socket join error:', err);
        reply({ error: 'Something went wrong' });
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      if (typeof conversationId === 'string') socket.leave(convRoom(conversationId));
    });

    // Send a message: same rules as the REST route, checked again on every send
    socket.on('message:send', async (data, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (!data || typeof data.conversationId !== 'string') {
          return reply({ error: 'Conversation not found' });
        }
        const { message, conversation } = await createMessage(data.conversationId, userId, data.text);
        broadcastMessage(io, conversation, message);
        reply({ ok: true, message: plain(message) });
      } catch (err) {
        if (err instanceof ChatError) return reply({ error: err.message, status: err.status });
        console.error('socket send error:', err);
        reply({ error: 'Something went wrong' });
      }
    });
  });

  return io;
};

module.exports = {
  initSocket,
  broadcastMessage,
  notifyConversationCreated,
  notifyConversationClosed,
  notifyConversationRemoved,
};