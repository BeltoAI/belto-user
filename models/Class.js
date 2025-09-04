// models/Class.js
import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  professorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  enrollmentCode: {
    type: String,
    required: true,
    unique: true
  },
  enrollmentUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  aiSettings: {
    model: {
      type: String,
      enum: ['Llama 3.1 8B', 'GPT-OSS 20B', 'RTX 4090 Models', 'DeepSeek-7B Chat'],
      default: 'Llama 3.1 8B'
    },
    copyPasteRestriction: {
      type: Boolean,
      default: false
    },
    temperature: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture'
  }]
}, {
  timestamps: true
});

export default mongoose.models.Class || mongoose.model('Class', ClassSchema);