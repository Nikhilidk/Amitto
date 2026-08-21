const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

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

module.exports = router;