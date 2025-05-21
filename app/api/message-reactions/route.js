import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MessageReaction from '@/models/MessageReaction';

export async function POST(req) {
  try {
    await connectDB();
    
    const { userId, sessionId, messageId, reactionType, studentId } = await req.json();
    
    // Validate required fields
    if (!userId || !sessionId || !messageId || !['like', 'dislike'].includes(reactionType)) {
      return NextResponse.json(
        { message: 'Missing required fields or invalid reaction type' }, 
        { status: 400 }
      );
    }
    
    // Find existing reaction
    let reaction = await MessageReaction.findOne({ userId, messageId });
    
    if (reaction) {
      // If reaction exists with the same type, delete it (toggling off)
      if (reaction.reactionType === reactionType) {
        await MessageReaction.deleteOne({ _id: reaction._id });
        return NextResponse.json({ 
          message: 'Reaction removed', 
          action: 'removed',
          reactionType 
        });
      } else {
        // Update existing reaction to new type
        reaction.reactionType = reactionType;
        // Update studentId if provided
        if (studentId) {
          reaction.studentId = studentId;
        }
        await reaction.save();
        return NextResponse.json({ 
          message: 'Reaction updated', 
          action: 'updated',
          reactionType
        });
      }
    } else {
      // Create new reaction
      const reactionData = {
        userId,
        sessionId,
        messageId,
        reactionType
      };
      
      // Add studentId if provided
      if (studentId) {
        reactionData.studentId = studentId;
      }
      
      reaction = await MessageReaction.create(reactionData);
      
      return NextResponse.json({ 
        message: 'Reaction saved', 
        action: 'created',
        reactionType
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error handling message reaction:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId'); // Add studentId to query params
    
    if (!userId || !sessionId) {
      return NextResponse.json({ message: 'User ID and Session ID are required' }, { status: 400 });
    }
    
    // Build query based on available parameters
    const query = { userId, sessionId };
    if (studentId) {
      query.studentId = studentId;
    }
    
    const reactions = await MessageReaction.find(query);
    
    // Format reactions as a map for easier client-side consumption
    const reactionsMap = {};
    reactions.forEach(r => {
      reactionsMap[r.messageId] = r.reactionType;
    });
    
    return NextResponse.json({ reactions: reactionsMap });
  } catch (error) {
    console.error('Error fetching message reactions:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}