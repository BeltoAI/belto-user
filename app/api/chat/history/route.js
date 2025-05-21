// app/api/chat/history/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      messages: session.messages.map(msg => ({
        ...msg.toObject(),
        _id: msg._id.toString(),
        timestamp: msg.timestamp.toISOString()
      }))
    });

  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}