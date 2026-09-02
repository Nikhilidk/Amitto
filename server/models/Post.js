const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  photoUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'other',
  },
  campusZone: {
    type: String,
    default: 'unspecified',
  },
  status: {
    type: String,
    enum: ['active', 'claim_pending', 'resolved'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);