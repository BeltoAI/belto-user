import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import ChatSession from '@/models/Chat';
import MessageReaction from '@/models/MessageReaction';
import Class from '@/models/Class';

export async function GET(request) {
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

    await connectDB();
    
    const user = await Student.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's chat sessions
    const userChats = await ChatSession.find({ userId: decoded.userId });
    
    // Calculate total prompts (non-bot messages)
    let totalPrompts = 0;
    
    for (const chat of userChats) {
      const userMessages = chat.messages.filter(msg => !msg.isBot);
      totalPrompts += userMessages.length;
    }

    // Get message reactions (likes/dislikes) - check both userId and studentId fields
    const reactions = await MessageReaction.find({ 
      $or: [
        { userId: decoded.userId },
        { studentId: decoded.userId }
      ]
    });
    const totalLikes = reactions.filter(r => r.reactionType === 'like').length;
    const totalDislikes = reactions.filter(r => r.reactionType === 'dislike').length;

    // Get sentiment analysis by class (placeholder for now)
    // In a real implementation, this would analyze the sentiment of user messages
    const sentimentAnalysis = {};
    
    // Get user's classes to generate sentiment data
    const userClasses = await Class.find({ 
      students: decoded.userId,
      status: 'active'
    }).select('name');

    for (const cls of userClasses) {
      // This is a placeholder - in reality, you'd analyze message sentiment
      const randomSentiment = Math.random();
      sentimentAnalysis[cls.name] = {
        overall: randomSentiment > 0.7 ? 'positive' : randomSentiment > 0.3 ? 'neutral' : 'negative',
        score: Math.round(randomSentiment * 10)
      };
    }

    const stats = {
      totalPrompts,
      totalLikes,
      totalDislikes,
      sentimentAnalysis
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
