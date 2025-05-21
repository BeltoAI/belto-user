import mongoose from 'mongoose';

const FlaggedMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  matchedKeywords: {
    type: [String],
    default: []
  },
  severity: {
    type: String,
    enum: ['medium', 'high'],
    required: true
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FlaggedMessage = mongoose.models.FlaggedMessage || mongoose.model('FlaggedMessage', FlaggedMessageSchema);

export default FlaggedMessage;