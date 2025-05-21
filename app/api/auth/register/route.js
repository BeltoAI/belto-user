// api/auth/register/route.js
import { generateToken } from '@/utils/generateTokens';
import { sendVerificationEmail } from '@/utils/sendEmail';
import Student from '@/models/Student';
import connectDB from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    await connectDB();

    try {
        const { username, email, password } = await request.json();

        // Check if student exists
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Generate token and hash password
        const verificationToken = generateToken();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create student instance
        const student = new Student({
            username,
            email,
            password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isVerified: false
        });

        // console.log('Student:', student);
        // console.log('Student emailVerificationToken:', student.emailVerificationToken);

        // Save the student
        const savedStudent = await student.save();
        
        // console.log('Student saved with token:', savedStudent.emailVerificationToken);

        // Send verification email with the saved token
        await sendVerificationEmail(email, savedStudent.emailVerificationToken);

        return NextResponse.json(
            { message: 'Registration successful. Please check your email to verify your account.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}