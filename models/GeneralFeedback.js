import mongoose from 'mongoose';

const GeneralFeedbackSchema = new mongoose.Schema({
  // Removed studentId field and reference
  email: { // Added email field
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true, // Store emails consistently
    // Optional: Add email validation regex if needed
    // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  q1_helpfulness: {
    type: String,
    required: [true, 'Answer to question 1 is required.'],
    trim: true,
  },
  q2_frustrations: {
    type: String,
    required: [true, 'Answer to question 2 is required.'],
    trim: true,
  },
  q3_improvement: {
    type: String,
    required: [true, 'Answer to question 3 is required.'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.GeneralFeedback || mongoose.model('GeneralFeedback', GeneralFeedbackSchema);