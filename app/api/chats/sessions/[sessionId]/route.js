import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatSession from '@/models/Chat';

export async function GET(request, { params }) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const session = await ChatSession.findById(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: session._id,
      userId: session.userId,
      lectureId: session.lectureId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}