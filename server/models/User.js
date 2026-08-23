const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  idPhotoUrl: {
    type: String,
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  trustScore: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);