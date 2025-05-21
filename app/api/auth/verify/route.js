// api/auth/verify/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Student from '@/models/Student';

export async function GET(request) {
    try {
        await connectDB();
        
        const token = request.nextUrl.searchParams.get('token');
        console.log('Verification - Received token:', token);
        
        if (!token) {
            return NextResponse.redirect(new URL('/auth/verify-error', request.url));
        }

        // Find student with exact token match
        const student = await Student.findOne({
            emailVerificationToken: token
        });

        if (!student) {
            return NextResponse.redirect(new URL('/auth/verify-error', request.url));
        }

        // Check expiration
        if (student.emailVerificationExpires < new Date()) {
            return NextResponse.redirect(new URL('/auth/verify-error', request.url));
        }

        // Update student verification status
        student.isVerified = true;
        student.emailVerificationToken = undefined;
        student.emailVerificationExpires = undefined;
        await student.save();

        // Redirect to login page with success message
        return NextResponse.redirect(new URL('/login?verified=true', request.url));

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.redirect(new URL('/auth/verify-error', request.url));
    }
}