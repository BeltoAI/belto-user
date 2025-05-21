import mongoose from 'mongoose';

const collaborationSchema = new mongoose.Schema({
    createdBy: {
        type: String,
        required: [true, 'Creator email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    groupName: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true,
        minlength: [3, 'Group name must be at least 3 characters long']
    },
    members: [{
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if model exists before creating it
export default mongoose.models.Collaboration || mongoose.model('Collaboration', collaborationSchema);