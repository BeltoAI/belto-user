import mongoose from 'mongoose';

const collaborativeDocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    collaborationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collaboration',
        required: true
    },
    createdBy: {
        type: String,
        required: true,
        trim: true
    },
    lastEditedBy: {
        type: String,
        required: true,
        trim: true
    },
    lastEditedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.CollaborativeDocument || mongoose.model('CollaborativeDocument', collaborativeDocumentSchema);