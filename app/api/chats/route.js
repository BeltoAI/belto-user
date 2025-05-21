import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

// app/api/chats/route.js
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    console.log('GET request:', userId, sessionId);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId
    });

    return NextResponse.json({ messages: session?.messages || [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, message } = body;
    
    if (!userId || !message) {
      return NextResponse.json({ error: 'User ID and message are required' }, { status: 400 });
    }

    // Find or create chat document for user
    let chat = await ChatSession.findOne({ userId });
    
    if (!chat) {
      chat = new ChatSession({ userId, messages: [] });
    }

    // Add new message
    chat.messages.push(message);
    chat.updatedAt = new Date();
    await chat.save();
    
    return NextResponse.json({ success: true, message: 'Message saved' });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}


// Add to your existing route.js file
export async function DELETE(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, messageId } = body;
    
    if (!userId || !messageId) {
      return NextResponse.json({ error: 'User ID and message ID are required' }, { status: 400 });
    }

    // Find chat and remove the specific message
    const chat = await ChatSession.findOne({ userId });
    if (chat) {
      chat.messages = chat.messages.filter(msg => msg._id.toString() !== messageId);
      await chat.save();
    }
    
    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}