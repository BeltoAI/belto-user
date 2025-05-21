import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

// app/api/chats/route.js
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ messages: session.messages || [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/chat/route.js
export async function POST(req) {
  try {
    await connectDB();
    const { userId, sessionId, message } = await req.json();

    if (!userId || !sessionId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Add the message to the session
    const newMessage = {
      isBot: message.isBot,
      avatar: message.avatar,
      name: message.name,
      message: message.message,
      suggestions: message.suggestions || [],
      attachments: message.attachments || [],
      timestamp: new Date(),
      tokenUsage: message.tokenUsage || {
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0
      }
    };

    session.messages.push(newMessage);
    await session.save();

    // Return the newly added message with its _id
    const savedMessage = session.messages[session.messages.length - 1];
    
    return NextResponse.json(savedMessage);

  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save message' },
      { status: 500 }
    );
  }
}

// Add to your existing route.js file
export async function DELETE(request) {
  try {
    await connectDB();
    const { userId, sessionId, messageId } = await request.json();
    
    if (!sessionId || !messageId) {
      return NextResponse.json(
        { error: 'Session ID and message ID are required' },
        { status: 400 }
      );
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Remove the message from the messages array
    session.messages = session.messages.filter(
      msg => msg._id.toString() !== messageId
    );
    await session.save();

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}