const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Multer setup — store file in memory temporarily before sending to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload a buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'amitto/id-photos' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// POST /api/auth/register
router.post('/register', upload.single('idPhoto'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password || !req.file) {
      return res.status(400).json({ error: 'All fields including ID photo are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload ID photo to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      idPhotoUrl: cloudinaryResult.secure_url,
    });

    await newUser.save();

    // Issue JWT
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful, pending admin verification',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        verificationStatus: newUser.verificationStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});
// GET /api/auth/me — get current logged-in user's profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});
// PATCH /api/posts/:id/status — update a post's status (only the post owner can do this)
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