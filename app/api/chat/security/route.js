import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

// GET endpoint to retrieve security counters for a session
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    // Ensure security object exists
    if (!session.security) {
      session.security = {
        totalPromptsUsed: 0,
        totalTokensUsed: 0,
        lastUpdated: new Date()
      };
      await session.save();
    }

    return NextResponse.json({
      sessionId: sessionId,
      security: {
        totalPromptsUsed: session.security.totalPromptsUsed || 0,
        totalTokensUsed: session.security.totalTokensUsed || 0,
        lastUpdated: session.security.lastUpdated
      },
      currentMessageCount: session.messages.length,
      // Calculate current tokens from existing messages (for comparison)
      calculatedTokens: session.messages.reduce((sum, msg) => {
        if (msg.isBot && msg.tokenUsage) {
          return sum + (msg.tokenUsage.total_tokens || 0);
        }
        return sum;
      }, 0),
      calculatedPrompts: session.messages.filter(msg => !msg.isBot).length
    });

  } catch (error) {
    console.error('Error retrieving security counters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve security counters' },
      { status: 500 }
    );
  }
}
