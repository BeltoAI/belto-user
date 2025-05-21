// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import Student from '@/models/Student'; // Changed from User to Student
import connectDB from '@/lib/db';
import { sendEmail as sendResetEmail } from '@/utils/sendEmail';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/utils/generateTokens';

// Handle POST request (send reset email)
export async function POST(request) {
    await connectDB();

    try {
        const { email } = await request.json();

        const student = await Student.findOne({ email }); // Changed from User to Student

        if (!student) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const resetToken = generateToken();
        student.resetPasswordToken = resetToken;
        student.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await student.save();

        await sendResetEmail(student.email, resetToken);

        return NextResponse.json({ message: 'Password reset email sent' }, { status: 200 });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
    }
}

// Handle PUT request (update password)
export async function PUT(request) {
    await connectDB();

    try {
        const { token, password } = await request.json();

        const student = await Student.findOne({ // Changed from User to Student
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!student) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        student.password = hashedPassword;
        student.resetPasswordToken = undefined;
        student.resetPasswordExpires = undefined;
        await student.save();

        return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
    }
}

// Handle other methods (optional)
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}