// app/api/chats/sessions/update-title/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

export async function PATCH(request) {
  try {
    await connectDB();
    
    const { sessionId, title } = await request.json();
    
    if (!sessionId || !title) {
      return NextResponse.json(
        { error: 'Session ID and title are required' },
        { status: 400 }
      );
    }

    const updatedSession = await ChatSession.findByIdAndUpdate(
      sessionId,
      { title },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session: updatedSession });

  } catch (error) {
    console.error('Update title error:', error);
    return NextResponse.json(
      { error: 'Failed to update session title' },
      { status: 500 }
    );
  }
}