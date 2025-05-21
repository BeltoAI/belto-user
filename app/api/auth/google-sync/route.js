import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import { sign } from 'jsonwebtoken';

export async function POST(request) {
    try {
        await connectDB();
        
        const { email, name, image } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find or create user
        let student = await Student.findOne({ email });
        
        if (!student) {
            // Create new student if doesn't exist
            student = new Student({
                username: name || email.split('@')[0],
                email,
                isVerified: true, // Google accounts are pre-verified
                googleAuth: true,
                picture: image
            });
            await student.save();
        }

        // Create JWT token for our own auth system
        const token = sign(
            { userId: student._id, email: student.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set HTTP-only cookie with JWT token
        const response = NextResponse.json(
            { 
                message: 'Google authentication successful', 
                user: { 
                    id: student._id, 
                    email: student.email,
                    username: student.username
                } 
            },
            { status: 200 }
        );

        // Set secure JWT cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400 // 24 hours
        });

        return response;
    } catch (error) {
        console.error('Google sync error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}