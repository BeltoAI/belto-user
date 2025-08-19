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
        required: function() {
            // Password is not required for Google OAuth users
            return !this.googleAuth;
        },
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: String,  // Changed from default: null
    emailVerificationExpires: Date,  // Changed from default: null
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Google OAuth fields
    googleId: {
        type: String,
        default: null
    },
    googleAuth: {
        type: Boolean,
        default: false
    },
    picture: {
        type: String,
        default: null
    },
    // Extended profile fields
    fullName: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['', 'male', 'female', 'non-binary', 'other', 'prefer-not-to-say'],
        default: ''
    },
    veterinarianStatus: {
        type: String,
        enum: ['', 'licensed-veterinarian', 'veterinary-student', 'veterinary-technician', 'not-veterinary'],
        default: ''
    },
    disabilityStatus: {
        type: String,
        enum: ['', 'no-disability', 'has-disability', 'prefer-not-to-say'],
        default: ''
    },
    ethnicity: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;