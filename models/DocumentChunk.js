import mongoose from 'mongoose';

const DocumentChunkSchema = new mongoose.Schema({
  documentId: { // To associate chunks with an original document/session
    type: String,
    required: true,
    index: true,
  },
  originalFilename: { // Original filename for context
    type: String,
    required: false,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // Array of numbers for the vector
    required: true,
  },
  metadata: { // Any other metadata from fileProcessing.js
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Create a compound index if you often query by documentId and chunkIndex
// DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.models.DocumentChunk || mongoose.model('DocumentChunk', DocumentChunkSchema);
