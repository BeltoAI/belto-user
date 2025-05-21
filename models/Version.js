// models/Version.js
import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  }
});

// Add index for faster queries
versionSchema.index({ documentId: 1, versionNumber: -1 });

const Version = mongoose.models.Version || mongoose.model('Version', versionSchema);
export default Version;