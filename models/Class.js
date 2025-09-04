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
          enum: [
            'Llama 3.1 8B Instruct (RTX 3090)',
            'GPT-OSS 20B (RTX 3090)',
            'GPT-OSS 20B F16 (RTX 4090)',
            'Hermes-3 Llama-3.2-3B (RTX 4090)',
            'DeepSeek 7B Chat (RTX 3060 Ti)',
            'GPT-OSS 20B Q4 (Double RTX 3060)',
            'Hermes-3B Q4 (Double RTX 3060)'
          ],
          default: 'Llama 3.1 8B Instruct (RTX 3090)'
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