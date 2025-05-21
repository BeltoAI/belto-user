import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';
import connectDB from '@/lib/db';
import Student from '@/models/Student';

export async function GET(request) {
    try {
        const token = getTokenFromCookie(request);
        
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = verifyAuth(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        await connectDB();
        
        const user = await Student.findById(decoded.userId).select('-password');
        
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}