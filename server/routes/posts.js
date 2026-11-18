const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const User = require('../models/User');
const ClaimAttempt = require('../models/ClaimAttempt');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const {
  notifyConversationCreated,
  notifyConversationClosed,
  notifyConversationRemoved,
} = require('../socket');
const { hashAnswer, checkAnswer } = require('../utils/claimAnswer');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const MAX_CLAIM_ATTEMPTS = 3;

// A chat request counts as "not yet sent" if the field is missing (old records) or 'none'
const REQUEST_ALREADY_USED = ['pending', 'accepted', 'declined', 'blocked'];

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'amitto/posts' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Cloudinary URL -> public_id, e.g. .../upload/v123/amitto/posts/abc.png -> amitto/posts/abc
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/);
  return match ? match[1] : null;
};

// Removes ALL chats on a post (a lost post can have several) and their messages.
// Returns the deleted conversations so callers can notify their participants.
const deleteConversationForPost = async (postId) => {
  const conversations = await Conversation.find({ post: postId });
  if (conversations.length > 0) {
    const ids = conversations.map((c) => c._id);
    await Message.deleteMany({ conversation: { $in: ids } });
    await Conversation.deleteMany({ _id: { $in: ids } });
  }
  return conversations;
};

// POST /api/posts — create a new post (verified users only)
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { type, title, description, category, campusZone, claimQuestion, claimAnswer } = req.body;

    if (!type || !title || !description || !req.file) {
      return res.status(400).json({ error: 'Type, title, description, and photo are required' });
    }
    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({ error: 'Type must be lost or found' });
    }

    // Found items need a verification question so the real owner can prove ownership
    let claimFields = {};
    if (type === 'found') {
      const q = typeof claimQuestion === 'string' ? claimQuestion.trim() : '';
      const a = typeof claimAnswer === 'string' ? claimAnswer.trim() : '';
      if (q.length < 5 || q.length > 200) {
        return res.status(400).json({ error: 'Add a verification question (5–200 characters)' });
      }
      if (!a || a.length > 100) {
        return res.status(400).json({ error: 'Add the answer to your verification question (max 100 characters)' });
      }
      claimFields = {
        claimQuestion: q,
        claimAnswerHash: await hashAnswer(a),
      };
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (currentUser.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Account verification required to create a post' });
    }

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

    const newPost = new Post({
      postedBy: req.user.userId,
      type,
      title,
      description,
      photoUrl: cloudinaryResult.secure_url,
      category: category || 'other',
      campusZone: campusZone || 'unspecified',
      ...claimFields,
    });

    await newPost.save();

    // select:false doesn't apply to a document we just built, so strip the hash manually
    const safePost = newPost.toObject();
    delete safePost.claimAnswerHash;

    res.status(201).json({ message: 'Post created successfully', post: safePost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating post' });
  }
});

// Helper: only accept plain strings from the query string.
// Express's query parser turns ?type[$ne]=x into an object, which would
// otherwise be passed straight into the Mongo query.
const asString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/posts — browse all posts, with optional filters
// ?type=lost|found &category=... &campusZone=... &status=... &q=search text
router.get('/', async (req, res) => {
  try {
    const filter = {};

    const type = asString(req.query.type);
    const category = asString(req.query.category);
    const campusZone = asString(req.query.campusZone);
    const status = asString(req.query.status);
    const q = asString(req.query.q);

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (campusZone) filter.campusZone = campusZone;
    if (status) filter.status = status;

    if (q) {
      const pattern = new RegExp(escapeRegex(q.slice(0, 100)), 'i');
      filter.$or = [{ title: pattern }, { description: pattern }];
    }

    const posts = await Post.find(filter)
      .select('-claimedBy')
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name photoUrl trustScore');

    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching posts' });
  }
});

// GET /api/posts/mine — posts created by the logged-in user
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.user.userId })
      .populate('claimedBy', 'name photoUrl')
      .sort({ createdAt: -1 });
    const lostPostIds = posts
      .filter((post) => post.type === 'lost')
      .map((post) => post._id);
    const pendingCounts = lostPostIds.length
      ? await Comment.aggregate([
          { $match: { post: { $in: lostPostIds }, status: 'pending' } },
          { $group: { _id: '$post', count: { $sum: 1 } } },
        ])
      : [];
    const countByPost = new Map(
      pendingCounts.map(({ _id, count }) => [_id.toString(), count])
    );

    res.status(200).json(posts.map((post) => {
      const result = post.toObject();
      if (post.type === 'lost') {
        result.pendingCommentCount = countByPost.get(post._id.toString()) || 0;
      }
      return result;
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching your posts' });
  }
});

// GET /api/posts/:id — single post details (public; token optional)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id)
      .populate('postedBy', 'name photoUrl trustScore');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Tell the claimant it's their claim, without exposing who claimed to everyone else
    const result = post.toObject();
    result.claimedByMe = Boolean(
      req.user && post.claimedBy && post.claimedBy.toString() === req.user.userId
    );
    delete result.claimedBy;

    // NEW: attempt counter + chat-request status for a logged-in user who isn't the owner
    result.myAttempts = null;
    if (req.user && post.type === 'found' && post.postedBy._id.toString() !== req.user.userId) {
      const attempt = await ClaimAttempt.findOne({ post: post._id, user: req.user.userId });
      result.myAttempts = {
        used: attempt ? Math.min(attempt.count, MAX_CLAIM_ATTEMPTS) : 0,
        max: MAX_CLAIM_ATTEMPTS,
        requestStatus: attempt ? attempt.requestStatus : 'none',
      };
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching post' });
  }
});

// POST /api/posts/:id/claim — answer the verification question to claim a found item
router.post('/:id/claim', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const { answer } = req.body;
    if (typeof answer !== 'string' || !answer.trim() || answer.length > 100) {
      return res.status(400).json({ error: 'Please enter an answer' });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (currentUser.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Account verification required to claim items' });
    }

    const post = await Post.findById(req.params.id).select('+claimAnswerHash');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.type !== 'found' || !post.claimAnswerHash) {
      return res.status(400).json({ error: 'This post cannot be claimed' });
    }
    if (post.postedBy.toString() === req.user.userId) {
      return res.status(403).json({ error: 'You cannot claim your own post' });
    }
    if (post.status !== 'active') {
      return res.status(409).json({ error: 'This item is no longer available to claim' });
    }

    // Reserve the attempt BEFORE checking the answer, atomically,
    // so parallel requests can't get extra tries
    const attempt = await ClaimAttempt.findOneAndUpdate(
      { post: post._id, user: req.user.userId },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    if (attempt.count > MAX_CLAIM_ATTEMPTS) {
      return res.status(429).json({
        error: 'No attempts left for this item',
        attemptsLeft: 0,
        requestStatus: attempt.requestStatus,
      });
    }

    const correct = await checkAnswer(answer, post.claimAnswerHash);
    if (!correct) {
      // NEW: keep what they tried, so the poster can judge a near miss if they ask to chat
      await ClaimAttempt.updateOne({ _id: attempt._id }, { $push: { answers: answer.trim() } });
      const attemptsLeft = MAX_CLAIM_ATTEMPTS - attempt.count;
      return res.status(403).json({
        error: 'Incorrect answer',
        attemptsLeft,
        canRequestChat: attemptsLeft === 0,
      });
    }

    // Conditional update: if two correct claimants arrive together, only one wins
    const updated = await Post.findOneAndUpdate(
      { _id: post._id, status: 'active' },
      { status: 'claim_pending', claimedBy: req.user.userId },
      { returnDocument: 'after' }
    ).select('-claimedBy');

    if (!updated) {
      return res.status(409).json({ error: 'Someone else just claimed this item' });
    }

    // Open the chat between the owner and the successful claimant
    const conversation = await Conversation.findOneAndUpdate(
      { post: post._id, claimant: req.user.userId },
      { $set: { owner: post.postedBy, status: 'open' } },
      { upsert: true, returnDocument: 'after' }
    );

    // Tell both users (live) that the chat exists
    notifyConversationCreated(req.app.get('io'), conversation);

    res.status(200).json({
      message: 'Claim accepted',
      post: updated,
      conversationId: conversation._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing claim' });
  }
});

// POST /api/posts/:id/claim/release — reject the pending claim and reopen the post (owner or admin)
router.post('/:id/claim/release', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the post owner or an admin can reject a claim' });
    }
    if (post.status !== 'claim_pending') {
      return res.status(409).json({ error: 'There is no pending claim on this post' });
    }

    const rejectedUserId = post.claimedBy;

    post.status = 'active';
    post.claimedBy = null;
    await post.save();

    // Rejected claimant loses chat access: remove the conversation and its messages,
    // and kick both users out of the live room
    const removed = await deleteConversationForPost(post._id);
    notifyConversationRemoved(req.app.get('io'), removed);

    // The rejected claimant can't simply try again, or ask to chat ('blocked')
    if (rejectedUserId) {
      await ClaimAttempt.findOneAndUpdate(
        { post: post._id, user: rejectedUserId },
        { $set: { count: MAX_CLAIM_ATTEMPTS, requestStatus: 'blocked' } },
        { upsert: true }
      );
    }

    res.status(200).json({ message: 'Claim rejected, post is active again', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error rejecting claim' });
  }
});

// NEW: POST /api/posts/:id/chat-request — after 3 wrong answers, ask the finder to chat anyway
router.post('/:id/chat-request', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    if (note.length > 200) {
      return res.status(400).json({ error: 'Note must be at most 200 characters' });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (currentUser.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Account verification required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.type !== 'found') {
      return res.status(400).json({ error: 'Chat requests are only for found items' });
    }
    if (post.postedBy.toString() === req.user.userId) {
      return res.status(403).json({ error: 'You cannot request a chat on your own post' });
    }
    if (post.status !== 'active') {
      return res.status(409).json({ error: 'This item is no longer available' });
    }

    const attempt = await ClaimAttempt.findOne({ post: post._id, user: req.user.userId });
    if (!attempt || attempt.count < MAX_CLAIM_ATTEMPTS) {
      return res.status(403).json({ error: 'Use all your attempts before asking for a chat' });
    }

    // Atomic, so a double click can't send two requests
    const updated = await ClaimAttempt.findOneAndUpdate(
      { _id: attempt._id, requestStatus: { $nin: REQUEST_ALREADY_USED } },
      { requestStatus: 'pending', requestNote: note },
      { returnDocument: 'after' }
    );
    if (!updated) {
      return res.status(409).json({ error: "You can't send a chat request for this item" });
    }

    res.status(201).json({ requestStatus: 'pending' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending chat request' });
  }
});

// NEW: GET /api/posts/:id/chat-requests — owner only: who asked, and what they tried
router.get('/:id/chat-requests', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = await Post.findById(req.params.id).select('postedBy status');
    if (!post || post.postedBy.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const requests = await ClaimAttempt.find({
      post: post._id,
      requestStatus: { $in: ['pending', 'accepted', 'declined'] },
    })
      .sort({ updatedAt: -1 })
      .populate('user', 'name photoUrl trustScore')
      .select('user answers requestStatus requestNote updatedAt')
      .lean();

    res.status(200).json({ postStatus: post.status, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching chat requests' });
  }
});

// NEW: POST /api/posts/:id/chat-requests/:userId/accept — that user becomes the claimant
router.post('/:id/chat-requests/:userId/accept', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.userId)) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.postedBy.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (post.status !== 'active') {
      return res.status(409).json({ error: 'This item already has a pending claim or is resolved' });
    }

    // pending -> accepted, atomically
    const request = await ClaimAttempt.findOneAndUpdate(
      { post: post._id, user: req.params.userId, requestStatus: 'pending' },
      { requestStatus: 'accepted' },
      { returnDocument: 'after' }
    );
    if (!request) {
      return res.status(409).json({ error: 'This request was already handled' });
    }

    // Same as a correct answer: only one claimant can win
    const updated = await Post.findOneAndUpdate(
      { _id: post._id, status: 'active' },
      { status: 'claim_pending', claimedBy: req.params.userId },
      { returnDocument: 'after' }
    );
    if (!updated) {
      await ClaimAttempt.updateOne({ _id: request._id }, { requestStatus: 'pending' });
      return res.status(409).json({ error: 'This item already has a pending claim' });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { post: post._id, claimant: req.params.userId },
      { $set: { owner: post.postedBy, status: 'open' } },
      { upsert: true, returnDocument: 'after' }
    );
    notifyConversationCreated(req.app.get('io'), conversation);

    res.status(200).json({ message: 'Request accepted', conversationId: conversation._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error accepting request' });
  }
});

// NEW: POST /api/posts/:id/chat-requests/:userId/decline — owner declines
router.post('/:id/chat-requests/:userId/decline', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.userId)) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const post = await Post.findById(req.params.id).select('postedBy');
    if (!post || post.postedBy.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const declined = await ClaimAttempt.findOneAndUpdate(
      { post: post._id, user: req.params.userId, requestStatus: 'pending' },
      { requestStatus: 'declined' },
      { returnDocument: 'after' }
    );
    if (!declined) {
      return res.status(409).json({ error: 'This request was already handled' });
    }

    res.status(200).json({ requestStatus: 'declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error declining request' });
  }
});

// PATCH /api/posts/:id/status — mark resolved / re-open (owner or admin)
// claim_pending can only be set by the claim route; a rejected claim goes through /claim/release
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const { status } = req.body;
    if (!['active', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Status can only be set to active or resolved' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the post owner or an admin can update its status' });
    }

    if (post.status === status) {
      return res.status(409).json({ error: `Post is already ${status}` });
    }

    if (status === 'active') {
      if (post.status === 'claim_pending') {
        return res.status(409).json({ error: 'Use "reject claim" to reopen a post with a pending claim' });
      }
      if (post.claimedBy) {
        return res.status(409).json({ error: 'A post resolved through a claim cannot be re-opened' });
      }
    }

    post.status = status;
    await post.save();

    if (status === 'resolved') {
      // All chats on the post become read-only history
      const convs = await Conversation.find({ post: post._id });
      await Conversation.updateMany({ post: post._id }, { status: 'closed' });
      notifyConversationClosed(req.app.get('io'), convs);
    } else {
      // Re-opened (only possible for never-claimed posts): chats are writable again
      await Conversation.updateMany({ post: post._id }, { status: 'open' });
    }

    res.status(200).json({ message: 'Status updated successfully', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating post status' });
  }
});

// DELETE /api/posts/:id — owner or admin
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the post owner or an admin can delete this post' });
    }

    await post.deleteOne();
    await ClaimAttempt.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });

    const removed = await deleteConversationForPost(post._id);
    notifyConversationRemoved(req.app.get('io'), removed);

    // Best-effort image cleanup: a Cloudinary failure shouldn't undo the delete
    try {
      const publicId = getPublicIdFromUrl(post.photoUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    } catch (imgErr) {
      console.error('Cloudinary cleanup failed:', imgErr);
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting post' });
  }
});

module.exports = router;