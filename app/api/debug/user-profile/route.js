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

        // Return debugging information
        const debugInfo = {
            userId: user._id,
            username: user.username,
            email: user.email,
            hasProfileImage: !!user.profileImage,
            profileImageType: user.profileImage ? 'base64' : 'none',
            profileImageLength: user.profileImage ? user.profileImage.length : 0,
            profileImageStartsWith: user.profileImage ? user.profileImage.substring(0, 50) + '...' : null,
            profileImageField: !!user.profileImage
        };

        return NextResponse.json(debugInfo);
    } catch (error) {
        console.error('Error fetching debug info:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
