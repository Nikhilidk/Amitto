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

// GET /api/posts — browse all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('postedBy', 'name email');
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

// PATCH /api/posts/:id/status — update a post's status
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

    if (post.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the post owner can update its status' });
    }

    post.status = status;
    await post.save();

    res.status(200).json({ message: 'Status updated successfully', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating post status' });
  }
});

module.exports = router;