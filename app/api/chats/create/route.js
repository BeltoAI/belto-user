// app/api/chats/create/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, lectureId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const newSession = new ChatSession({
      userId,
      lectureId, // Add lectureId to the session
      title: 'New Chat',
      messages: []
    });

    await newSession.save();
    
    return NextResponse.json({ 
      success: true, 
      session: {
        ...newSession.toObject(),
        _id: newSession._id.toString(),
        createdAt: newSession.createdAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create new session. Please try again.' },
      { status: 500 }
    );
  }
}
