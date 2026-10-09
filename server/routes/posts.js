const mongoose = require('mongoose'); 
const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

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
    const { type, title, description, category, campusZone } = req.body;

    if (!type || !title || !description || !req.file) {
      return res.status(400).json({ error: 'Type, title, description, and photo are required' });
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
    });

    await newPost.save();

    res.status(201).json({ message: 'Post created successfully', post: newPost });
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
    const posts = await Post.find({ postedBy: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching your posts' });
  }
});

// GET /api/posts/:id — single post details (public)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id)
      .populate('postedBy', 'name photoUrl trustScore');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching post' });
  }
});

// PATCH /api/posts/:id/status — update a post's status (owner or admin)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'claim_pending', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the post owner or an admin can update its status' });
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