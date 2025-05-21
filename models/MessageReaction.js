import mongoose from 'mongoose';

const messageReactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messageId: {
    type: String,
    required: true,
    index: true
  },
  studentId: {  // Added new field
    type: String,
    index: true
  },
  reactionType: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index for ensuring uniqueness per user/message
messageReactionSchema.index({ userId: 1, messageId: 1 }, { unique: true });

const MessageReaction = mongoose.models.MessageReaction || mongoose.model('MessageReaction', messageReactionSchema);
export default MessageReaction;