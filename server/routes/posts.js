const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const User = require('../models/User');
const ClaimAttempt = require('../models/ClaimAttempt');
const { hashAnswer, checkAnswer } = require('../utils/claimAnswer');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const MAX_CLAIM_ATTEMPTS = 3;

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
    res.status(200).json(posts);
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
      return res.status(429).json({ error: 'No attempts left for this item', attemptsLeft: 0 });
    }

    const correct = await checkAnswer(answer, post.claimAnswerHash);
    if (!correct) {
      return res.status(403).json({
        error: 'Incorrect answer',
        attemptsLeft: MAX_CLAIM_ATTEMPTS - attempt.count,
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

    res.status(200).json({ message: 'Claim accepted', post: updated });
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

    // The rejected claimant can't simply try again
    if (rejectedUserId) {
      await ClaimAttempt.findOneAndUpdate(
        { post: post._id, user: rejectedUserId },
        { $set: { count: MAX_CLAIM_ATTEMPTS } },
        { upsert: true }
      );
    }

    res.status(200).json({ message: 'Claim rejected, post is active again', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error rejecting claim' });
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