import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FlaggedMessage from '@/models/FlaggedMessage';

export async function POST(req) {
  try {
    const { content, sessionId, matchedKeywords, severity, userId } = await req.json();
    
    if (!content || !sessionId || !matchedKeywords || !severity || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const flaggedMessage = await FlaggedMessage.create({
      userId,
      sessionId,
      content,
      matchedKeywords,
      severity
    });
    
    return NextResponse.json(
      { message: 'Message flagged successfully', flaggedMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error flagging message:', error);
    return NextResponse.json(
      { error: 'Failed to flag message' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const reviewed = searchParams.get('reviewed');
    const severity = searchParams.get('severity');
    
    // Build query
    const query = {};
    if (reviewed !== null) query.reviewed = reviewed === 'true';
    if (severity) query.severity = severity;
    
    const flaggedMessages = await FlaggedMessage.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('sessionId', 'title')
      .limit(100);
    
    return NextResponse.json({ flaggedMessages }, { status: 200 });
  } catch (error) {
    console.error('Error getting flagged messages:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve flagged messages' },
      { status: 500 }
    );
  }
}