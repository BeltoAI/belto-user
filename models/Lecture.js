// models/Lecture.js
import mongoose from 'mongoose';

const LectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lecture title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
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
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  materials: [{
    title: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attendance: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'excused'],
      default: 'absent'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  faqs: [{
    question: String,
    answer: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  copyPasteRestricted: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

export default mongoose.models.Lecture || mongoose.model('Lecture', LectureSchema);