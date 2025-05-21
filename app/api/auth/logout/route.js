import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // Clear the JWT token cookie
        const cookieStore = cookies();
        cookieStore.delete('token');
        
        // Clear NextAuth session if you're using it alongside custom auth
        cookieStore.delete('next-auth.session-token');
        cookieStore.delete('next-auth.callback-url');
        cookieStore.delete('next-auth.csrf-token');
        
        return NextResponse.json(
            { success: true, message: 'Logged out successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to logout' },
            { status: 500 }
        );
    }
}