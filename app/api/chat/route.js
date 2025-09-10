import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

// app/api/chats/route.js
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    
    console.log('📖 Chat history request:', {
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'missing',
      userId: userId ? 'present' : 'missing'
    });

    if (!sessionId) {
      console.error('❌ Session ID is required for chat history');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Validate sessionId format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.error('❌ Invalid sessionId format:', sessionId);
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      console.error('❌ Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If userId is provided, verify it matches
    if (userId && session.userId !== userId) {
      console.error('❌ Session userId mismatch:', { sessionUserId: session.userId, requestUserId: userId });
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    console.log('✅ Chat history loaded:', {
      sessionId: sessionId.substring(0, 8) + '...',
      messageCount: session.messages?.length || 0
    });

    return NextResponse.json({ 
      messages: session.messages || [],
      sessionId: session._id,
      userId: session.userId,
      title: session.title || 'Chat Session'
    });
  } catch (error) {
    console.error('💥 Error fetching chat history:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch chat history',
      details: error.message,
      type: error.name
    }, { status: 500 });
  }
}

// app/api/chat/route.js
export async function POST(req) {
  try {
    await connectDB();
    const { userId, sessionId, message } = await req.json();

    // Enhanced logging for debugging
    console.log('📝 Chat API POST request:', {
      userId: userId ? 'present' : 'missing',
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'missing',
      messageType: message ? (message.isBot ? 'bot' : 'user') : 'missing',
      messageLength: message?.message?.length || 0
    });

    if (!userId || !sessionId || !message) {
      console.error('❌ Missing required fields:', { userId: !!userId, sessionId: !!sessionId, message: !!message });
      return NextResponse.json(
        { error: "Missing required fields: userId, sessionId, and message are required" },
        { status: 400 }
      );
    }

    // Validate sessionId format (should be a valid ObjectId)
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.error('❌ Invalid sessionId format:', sessionId);
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      console.error('❌ Session not found:', sessionId);
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify the session belongs to the user
    if (session.userId !== userId) {
      console.error('❌ Session userId mismatch:', { sessionUserId: session.userId, requestUserId: userId });
      return NextResponse.json(
        { error: "Session does not belong to this user" },
        { status: 403 }
      );
    }

    // Create the message object with proper validation and defaults
    const newMessage = {
      isBot: Boolean(message.isBot),
      avatar: String(message.avatar || '').trim() || (message.isBot ? '/logo.png' : ''),
      name: String(message.name || '').trim() || (message.isBot ? 'BELTO' : 'User'),
      message: String(message.message || '').trim(),
      suggestions: Array.isArray(message.suggestions) ? message.suggestions : [],
      attachments: Array.isArray(message.attachments) ? message.attachments.map(att => ({
        name: String(att.name || ''),
        content: String(att.content || '')
      })) : [],
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      tokenUsage: {
        total_tokens: Number(message.tokenUsage?.total_tokens) || 0,
        prompt_tokens: Number(message.tokenUsage?.prompt_tokens) || 0,
        completion_tokens: Number(message.tokenUsage?.completion_tokens) || 0
      }
    };

    // Validate message content
    if (!newMessage.message || newMessage.message.length === 0) {
      console.error('❌ Empty message content');
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    // Add the message to the session
    session.messages.push(newMessage);
    
    // SECURITY: Update cumulative counters that NEVER decrease when messages are deleted
    if (!session.security) {
      session.security = {
        totalPromptsUsed: 0,
        totalTokensUsed: 0,
        lastUpdated: new Date()
      };
    }
    
    // Increment security counters for tracking purposes
    if (!newMessage.isBot) {
      // User message - increment prompt counter
      session.security.totalPromptsUsed += 1;
      console.log('🔒 SECURITY: Prompt counter incremented on server', {
        sessionId: sessionId.substring(0, 8) + '...',
        newPromptCount: session.security.totalPromptsUsed
      });
    } else if (newMessage.tokenUsage && newMessage.tokenUsage.total_tokens) {
      // Bot message with token usage - increment token counter
      session.security.totalTokensUsed += newMessage.tokenUsage.total_tokens;
      console.log('🔒 SECURITY: Token counter incremented on server', {
        sessionId: sessionId.substring(0, 8) + '...',
        tokensAdded: newMessage.tokenUsage.total_tokens,
        newTokenTotal: session.security.totalTokensUsed
      });
    }
    
    session.security.lastUpdated = new Date();
    
    // Save the session with proper error handling
    try {
      await session.save();
      console.log('✅ Message saved successfully:', {
        sessionId: sessionId.substring(0, 8) + '...',
        messageType: newMessage.isBot ? 'bot' : 'user',
        messageLength: newMessage.message.length,
        totalMessages: session.messages.length
      });
    } catch (saveError) {
      console.error('❌ Failed to save session:', saveError);
      return NextResponse.json(
        { error: "Failed to save message to database: " + saveError.message },
        { status: 500 }
      );
    }

    // Return the newly added message with its _id
    const savedMessage = session.messages[session.messages.length - 1];
    
    return NextResponse.json({
      _id: savedMessage._id,
      ...savedMessage.toObject(),
      success: true
    });

  } catch (error) {
    console.error('💥 Error in chat POST endpoint:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to save message',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

// Add to your existing route.js file
export async function DELETE(request) {
  try {
    await connectDB();
    const { userId, sessionId, messageId } = await request.json();
    
    console.log('🗑️ Delete message request:', {
      userId: userId ? 'present' : 'missing',
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'missing',
      messageId: messageId ? messageId.substring(0, 8) + '...' : 'missing'
    });
    
    if (!sessionId || !messageId) {
      console.error('❌ Missing required fields for delete');
      return NextResponse.json(
        { error: 'Session ID and message ID are required' },
        { status: 400 }
      );
    }

    // Validate sessionId and messageId format
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      console.error('❌ Invalid ID format');
      return NextResponse.json(
        { error: 'Invalid session ID or message ID format' },
        { status: 400 }
      );
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      console.error('❌ Session not found for delete:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify session belongs to user if userId provided
    if (userId && session.userId !== userId) {
      console.error('❌ Session userId mismatch for delete');
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    // Find the message to delete and its index
    const messageIndex = session.messages.findIndex(msg => msg._id.toString() === messageId);
    if (messageIndex === -1) {
      console.error('❌ Message not found in session:', messageId);
      return NextResponse.json({ error: 'Message not found in session' }, { status: 404 });
    }

    const messageToDelete = session.messages[messageIndex];
    const messagesToDelete = [messageIndex];

    // Determine if we need to delete the paired message
    if (messageToDelete.isBot && messageIndex > 0) {
      // Bot message - check if previous message is a user message
      const prevMessage = session.messages[messageIndex - 1];
      if (!prevMessage.isBot) {
        messagesToDelete.unshift(messageIndex - 1); // Add previous user message
        console.log('🔗 Deleting bot message and its paired user message');
      }
    } else if (!messageToDelete.isBot && messageIndex + 1 < session.messages.length) {
      // User message - check if next message is a bot message
      const nextMessage = session.messages[messageIndex + 1];
      if (nextMessage.isBot) {
        messagesToDelete.push(messageIndex + 1); // Add next bot message
        console.log('🔗 Deleting user message and its paired bot message');
      }
    }

    // Remove the message(s) from the messages array (remove in reverse order to maintain indices)
    const originalCount = session.messages.length;
    for (let i = messagesToDelete.length - 1; i >= 0; i--) {
      session.messages.splice(messagesToDelete[i], 1);
    }

    const deletedCount = originalCount - session.messages.length;
    if (deletedCount === 0) {
      console.error('❌ No messages were removed');
      return NextResponse.json({ error: 'Failed to remove message' }, { status: 500 });
    }

    // Save the session
    try {
      await session.save();
      console.log('✅ Message(s) deleted successfully:', {
        sessionId: sessionId.substring(0, 8) + '...',
        messageId: messageId.substring(0, 8) + '...',
        deletedCount,
        remainingMessages: session.messages.length
      });
    } catch (saveError) {
      console.error('❌ Failed to save after delete:', saveError);
      return NextResponse.json(
        { error: 'Failed to save after deleting message: ' + saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: `${deletedCount} message(s) deleted successfully`,
      deletedCount,
      remainingMessages: session.messages.length,
      success: true
    });
  } catch (error) {
    console.error('💥 Error deleting message:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete message',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}