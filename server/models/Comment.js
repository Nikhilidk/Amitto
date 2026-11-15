const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
}, { timestamps: true });

// one comment per user per post (this is also what keeps a declined user out)
commentSchema.index({ post: 1, author: 1 }, { unique: true });
commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);