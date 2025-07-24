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

    const { subject, message, priority, userEmail, userId } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store the help request in a database
    // 2. Send notification to support team
    // 3. Send confirmation email to user
    // 4. Create a ticket in your support system

    console.log('Help request submitted:', {
      userId,
      userEmail,
      subject,
      message,
      priority,
      timestamp: new Date().toISOString()
    });

    // For now, just return success
    return NextResponse.json(
      { 
        message: 'Help request submitted successfully',
        ticketId: `HELP-${Date.now()}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting help request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
