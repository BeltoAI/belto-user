import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    // Await params before using it
    const { messageId } = await Promise.resolve(params);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId || !messageId) {
      return NextResponse.json(
        { error: 'Session ID and message ID are required' },
        { status: 400 }
      );
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Find the message index
    const messageIndex = session.messages.findIndex(
      msg => msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Handle paired message deletion
    if (!session.messages[messageIndex].isBot && messageIndex + 1 < session.messages.length) {
      // Remove both user message and AI response
      session.messages.splice(messageIndex, 2);
    } else if (session.messages[messageIndex].isBot && messageIndex > 0) {
      // Remove both AI response and preceding user message
      session.messages.splice(messageIndex - 1, 2);
    } else {
      // Remove single message
      session.messages.splice(messageIndex, 1);
    }

    // CRITICAL SECURITY: DO NOT modify session.security counters
    // The security.totalPromptsUsed and security.totalTokensUsed should NEVER decrease
    // This prevents users from bypassing limits by deleting messages
    console.log('🔒 SECURITY: Message deleted but security counters preserved', {
      sessionId: sessionId.substring(0, 8) + '...',
      messagesRemaining: session.messages.length,
      securityPromptsUsed: session.security?.totalPromptsUsed || 0,
      securityTokensUsed: session.security?.totalTokensUsed || 0,
      securityNote: 'Counters intentionally NOT decremented to prevent limit bypass'
    });

    await session.save();
    return NextResponse.json({ message: 'Messages deleted successfully' });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}
