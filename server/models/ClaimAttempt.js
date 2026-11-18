const mongoose = require('mongoose');

const claimAttemptSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  count: { type: Number, default: 0 },
}, { timestamps: true });

// one record per user per post; this also makes the upsert safe
claimAttemptSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ClaimAttempt', claimAttemptSchema);