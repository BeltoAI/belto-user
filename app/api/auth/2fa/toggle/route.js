import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';

export async function POST(request) {
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

    const { enabled } = await request.json();

    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Generate QR codes for authenticator apps
    // 2. Store 2FA secrets securely
    // 3. Verify initial setup with codes
    // 4. Update user's 2FA status in database

    return NextResponse.json(
      { 
        message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
        enabled: enabled
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
