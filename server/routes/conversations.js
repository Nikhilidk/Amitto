const { broadcastMessage } = require('../socket');
const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');
const { getParticipantConversation, createMessage } = require('../utils/chat');

const router = express.Router();

// Every chat route needs a logged-in user
router.use(verifyToken);

// GET /api/conversations — my inbox, newest activity first
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Conversation.find({
      $or: [{ owner: userId }, { claimant: userId }],
    })
      .sort({ lastMessageAt: -1 })
      .populate('post', 'title photoUrl status type')
      .populate('owner', 'name photoUrl')
      .populate('claimant', 'name photoUrl')
      .lean();

    const items = await Promise.all(
      conversations.map(async (c) => {
        const isOwner = c.owner._id.toString() === userId;
        const lastMessage = await Message.findOne({ conversation: c._id })
          .sort({ createdAt: -1 })
          .select('text sender createdAt')
          .lean();

        return {
          _id: c._id,
          status: c.status,
          post: c.post,
          isOwner,
          other: isOwner ? c.claimant : c.owner,
          lastMessage,
          lastMessageAt: c.lastMessageAt,
        };
      })
    );

    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching conversations' });
  }
});

// GET /api/conversations/by-post/:postId — find my chat for a post (for the "Message" button)
router.get('/by-post/:postId', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = await Conversation.findOne({ post: req.params.postId });
    const userId = req.user.userId;
    const isParticipant =
      conversation &&
      (conversation.owner.toString() === userId || conversation.claimant.toString() === userId);

    if (!isParticipant) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(200).json({ conversationId: conversation._id, status: conversation.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error finding conversation' });
  }
});

// GET /api/conversations/:id/messages — history, oldest to newest
// ?limit=50 (max 100)  &before=<messageId> loads older messages
router.get('/:id/messages', async (req, res) => {
  try {
    const conversation = await getParticipantConversation(req.params.id, req.user.userId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = { conversation: conversation._id };

    if (typeof req.query.before === 'string' && req.query.before) {
      if (!mongoose.isValidObjectId(req.query.before)) {
        return res.status(400).json({ error: 'Invalid before value' });
      }
      filter._id = { $lt: req.query.before };
    }

    // Fetch one extra row to know whether older messages exist
    const rows = await Message.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit).reverse();

    res.status(200).json({ status: conversation.status, messages, hasMore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// POST /api/conversations/:id/messages — send a message
router.post('/:id/messages', async (req, res) => {
  try {
    const { message, conversation } = await createMessage(req.params.id, req.user.userId, req.body.text);
    broadcastMessage(req.app.get('io'), conversation, message);
    res.status(201).json({ message });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

module.exports = router;