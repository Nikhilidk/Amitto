const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { verifyToken } = require('../middleware/auth');
const {
  notifyCommentNew,
  notifyCommentUpdated,
  notifyConversationCreated,
} = require('../socket');

const MAX_COMMENT_LENGTH = 500;
const MAX_ACCEPTED_FINDERS = 3;
const MAX_COMMENTS_PER_HOUR = 10;

const router = express.Router();

// POST /api/posts/:postId/comments — "I found this" on a lost post
router.post('/posts/:postId/comments', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      return res.status(400).json({ error: 'Please describe what you found' });
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment must be at most ${MAX_COMMENT_LENGTH} characters` });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (currentUser.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Account verification required to comment' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.type !== 'lost') {
      return res.status(400).json({ error: 'Comments are only for lost items' });
    }
    if (post.postedBy.toString() === req.user.userId) {
      return res.status(403).json({ error: 'You cannot comment on your own post' });
    }
    if (post.status !== 'active') {
      return res.status(409).json({ error: 'This item is no longer open' });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await Comment.countDocuments({ author: req.user.userId, createdAt: { $gte: since } });
    if (recent >= MAX_COMMENTS_PER_HOUR) {
      return res.status(429).json({ error: 'You are commenting too fast. Please try again later.' });
    }

    let comment;
    try {
      comment = await Comment.create({ post: post._id, author: req.user.userId, text });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'You have already commented on this post' });
      }
      throw err;
    }

    notifyCommentNew(req.app.get('io'), post.postedBy, comment);

    res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting comment' });
  }
});

// GET /api/posts/:postId/comments — owner sees all; everyone else sees only their own
router.get('/posts/:postId/comments', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.postId).select('postedBy');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isOwner = post.postedBy.toString() === req.user.userId;
    const filter = isOwner
      ? { post: post._id }
      : { post: post._id, author: req.user.userId };

    let query = Comment.find(filter).sort({ createdAt: -1 });
    if (isOwner) query = query.populate('author', 'name photoUrl trustScore');
    const comments = await query.lean();

    res.status(200).json({ isOwner, maxAccepted: MAX_ACCEPTED_FINDERS, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching comments' });
  }
});

// Loads a comment and its post, and only lets the post owner through.
// Anyone else gets a 404 so they can't tell whether the comment exists.
const loadOwnedComment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: 'Comment not found' });
    return null;
  }
  const comment = await Comment.findById(req.params.id);
  const post = comment ? await Post.findById(comment.post) : null;
  if (!comment || !post || post.postedBy.toString() !== req.user.userId) {
    res.status(404).json({ error: 'Comment not found' });
    return null;
  }
  if (post.status !== 'active') {
    res.status(409).json({ error: 'This post is no longer open, so its chats are read-only' });
    return null;
  }
  return { comment, post };
};

// POST /api/comments/:id/accept — owner opens a chat with this finder
router.post('/comments/:id/accept', verifyToken, async (req, res) => {
  try {
    const loaded = await loadOwnedComment(req, res);
    if (!loaded) return;
    const { comment, post } = loaded;

    // Flip pending -> accepted atomically so a double click can't accept twice
    const accepted = await Comment.findOneAndUpdate(
      { _id: comment._id, status: 'pending' },
      { status: 'accepted' },
      { returnDocument: 'after' }
    );
    if (!accepted) {
      return res.status(409).json({ error: 'This comment was already handled' });
    }

    // Count after flipping; if over the cap, undo
    const acceptedCount = await Comment.countDocuments({ post: post._id, status: 'accepted' });
    if (acceptedCount > MAX_ACCEPTED_FINDERS) {
      await Comment.updateOne({ _id: comment._id }, { status: 'pending' });
      return res.status(409).json({
        error: `You can chat with at most ${MAX_ACCEPTED_FINDERS} finders per post`,
      });
    }

    let conversation;
    let updated;
    try {
      conversation = await Conversation.findOneAndUpdate(
        { post: post._id, claimant: comment.author },
        { $set: { owner: post.postedBy, status: 'open' } },
        { upsert: true, returnDocument: 'after' }
      );
      updated = await Comment.findByIdAndUpdate(
        comment._id,
        { conversation: conversation._id },
        { returnDocument: 'after' }
      );
    } catch (err) {
      await Comment.updateOne({ _id: comment._id }, { status: 'pending', conversation: null });
      throw err;
    }

    const io = req.app.get('io');
    notifyConversationCreated(io, conversation);
    notifyCommentUpdated(io, updated);

    res.status(200).json({ comment: updated, conversationId: conversation._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error accepting comment' });
  }
});

// POST /api/comments/:id/decline — owner declines; the finder just sees a neutral status
router.post('/comments/:id/decline', verifyToken, async (req, res) => {
  try {
    const loaded = await loadOwnedComment(req, res);
    if (!loaded) return;

    const declined = await Comment.findOneAndUpdate(
      { _id: loaded.comment._id, status: 'pending' },
      { status: 'declined' },
      { returnDocument: 'after' }
    );
    if (!declined) {
      return res.status(409).json({ error: 'This comment was already handled' });
    }

    notifyCommentUpdated(req.app.get('io'), declined);

    res.status(200).json({ comment: declined });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error declining comment' });
  }
});

// DELETE /api/comments/:id — author withdraws a comment that is still pending
router.delete('/comments/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.author.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (comment.status !== 'pending') {
      return res.status(409).json({ error: 'Only pending comments can be withdrawn' });
    }

    const deleted = await Comment.findOneAndDelete({ _id: comment._id, status: 'pending' });
    if (!deleted) {
      return res.status(409).json({ error: 'This comment was already handled' });
    }

    res.status(200).json({ message: 'Comment withdrawn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error withdrawing comment' });
  }
});

module.exports = router;