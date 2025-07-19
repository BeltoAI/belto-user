// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true // Allows multiple documents to have null/undefined username
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['professor', 'student', 'admin'],
    default: 'professor'
  },
  // Profile information
  phone: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', '']
  },
  language: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  profilePicture: String,
  
  // User AI Preferences (Pre/Post Rules)
  aiPreferences: {
    preRules: [{
      name: String,
      content: String,
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    postRules: [{
      name: String,
      content: String,
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    personalityTone: {
      type: String,
      enum: ['professional', 'friendly', 'casual', 'academic', 'custom'],
      default: 'friendly'
    },
    customTone: String,
    enablePersonalization: {
      type: Boolean,
      default: true
    }
  },
  
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  verificationToken: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationExpires: Date
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);