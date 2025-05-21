// models/Document.js
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentId: { // Client-generated unique ID for the document file
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filetype: {
    type: String
  },
  totalChunks: {
    type: Number
  },
  textPreview: { // A short preview of the document content
    type: String
  },
  status: { // Status of the document processing (e.g., pending, processing, processed, error)
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'processed', 'error']
  },
  currentContent: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  currentVersion: {
    type: Number,
    default: 1
  }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export default Document;
