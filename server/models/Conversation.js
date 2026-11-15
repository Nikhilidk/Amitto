const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // On found posts this is the claimant; on lost posts it is the finder
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Found posts have one chat (the current claimant); lost posts have one per accepted finder
conversationSchema.index({ post: 1, claimant: 1 }, { unique: true });
conversationSchema.index({ owner: 1, lastMessageAt: -1 });
conversationSchema.index({ claimant: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);