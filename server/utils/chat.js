const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES_PER_MINUTE = 20;

class ChatError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Returns the conversation only if the user is its owner or claimant, otherwise null
const getParticipantConversation = async (conversationId, userId) => {
  if (!mongoose.isValidObjectId(conversationId)) return null;
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;
  const isParticipant =
    conversation.owner.toString() === userId || conversation.claimant.toString() === userId;
  return isParticipant ? conversation : null;
};

// Validates, enforces the rules, saves the message and bumps the conversation.
// Throws ChatError(status, message) on any rule violation.
const createMessage = async (conversationId, userId, rawText) => {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new ChatError(400, 'Message cannot be empty');
  }
  const text = rawText.trim();
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new ChatError(400, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
  }

  const conversation = await getParticipantConversation(conversationId, userId);
  if (!conversation) throw new ChatError(404, 'Conversation not found');
  if (conversation.status !== 'open') {
    throw new ChatError(409, 'This conversation is read-only');
  }

  // Rate limit counted from the database, so REST and sockets share one limit
  const since = new Date(Date.now() - 60 * 1000);
  const recent = await Message.countDocuments({ sender: userId, createdAt: { $gte: since } });
  if (recent >= MAX_MESSAGES_PER_MINUTE) {
    throw new ChatError(429, 'You are sending messages too fast. Please wait a moment.');
  }

  const message = await Message.create({ conversation: conversation._id, sender: userId, text });
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return { message, conversation };
};

module.exports = {
  ChatError,
  MAX_MESSAGE_LENGTH,
  getParticipantConversation,
  createMessage,
};