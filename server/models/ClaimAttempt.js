const mongoose = require('mongoose');

const claimAttemptSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  count: { type: Number, default: 0 },
  // Wrong answers this user tried (shown to the poster only if the user asks to chat)
  answers: { type: [String], default: [] },
  // none -> pending -> accepted / declined. "blocked" = claimant the poster rejected: no chat request allowed
  requestStatus: {
    type: String,
    enum: ['none', 'pending', 'accepted', 'declined', 'blocked'],
    default: 'none',
  },
  requestNote: { type: String, trim: true, maxlength: 200, default: '' },
}, { timestamps: true });

// one record per user per post; this also makes the upsert safe
claimAttemptSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ClaimAttempt', claimAttemptSchema);