const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // one conversation per post; a rejected claim deletes it, so this never collides
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ owner: 1, lastMessageAt: -1 });
conversationSchema.index({ claimant: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);