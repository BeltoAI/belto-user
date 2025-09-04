// models/ChatSession.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  isBot: {
    type: Boolean,
    required: true
  },
  avatar: {
    type: String,
    required: false, // Changed to false to allow empty avatars
    default: '' // Provide default empty string
  },
  name: {
    type: String,
    required: true,
    default: 'User' // Provide default name
  },
  message: {
    type: String,
    required: true
  },
  suggestions: {
    type: [String],
    default: []
  },
  attachments: [{
    name: String,
    content: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokenUsage: {
    total_tokens: { type: Number, default: 0 },
    prompt_tokens: { type: Number, default: 0 },
    completion_tokens: { type: Number, default: 0 }
  }
}, { timestamps: true });

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema]
}, { timestamps: true });

// Ensure model isn't already defined
const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;