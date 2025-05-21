// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: String,  // Changed from default: null
    emailVerificationExpires: Date,  // Changed from default: null
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;