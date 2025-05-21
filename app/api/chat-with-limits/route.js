import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';
import { generateAIResponseWithPreferences } from '@/utils/aiUtils';

export async function POST(req) {
  try {
    await connectDB();
    const { userId, sessionId, message, attachment, aiPreferences } = await req.json();

    if (!userId || !sessionId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tokenLimit = aiPreferences?.maxTokens || 30000;
    const promptLimit = aiPreferences?.numPrompts || 100;

    // Fetch the session to check current usage
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Calculate current token usage
    let currentTokenUsage = 0;
    session.messages.forEach(msg => {
      if (msg.isBot && msg.tokenUsage) {
        const usage = typeof msg.tokenUsage === 'string' 
          ? JSON.parse(msg.tokenUsage) 
          : msg.tokenUsage;
        currentTokenUsage += (usage.total_tokens || 0);
      }
    });

    // Count user prompts
    const userPromptCount = session.messages.filter(msg => !msg.isBot).length;
    
    // Check if we've reached the maximum prompts limit
    if (userPromptCount >= promptLimit) {
      const limitMessage = {
        id: `limit-${Date.now()}`,
        isBot: true,
        message: `I apologize, but you've reached the maximum number of prompts (${promptLimit}) for this session.`,
        timestamp: new Date(),
        tokenUsage: {
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0
        }
      };
      
      session.messages.push(limitMessage);
      await session.save();
      
      return NextResponse.json(limitMessage);
    }

    // Add user message to the session
    const userMessage = {
      isBot: false,
      message: message,
      timestamp: new Date(),
      attachment: attachment || null
    };
    
    session.messages.push(userMessage);
    await session.save();

    // Get chat history in the correct format for AI processing
    const chatHistory = session.messages.map(msg => ({
      role: msg.isBot ? 'assistant' : 'user',
      content: msg.message
    }));

    try {
      // Process the message with AI
      const aiResponse = await generateAIResponseWithPreferences(
        message, 
        chatHistory, 
        aiPreferences
      );

      // Check if new response would exceed token limit
      if (currentTokenUsage + aiResponse.tokenUsage.total_tokens > tokenLimit) {
        const limitMessage = {
          id: `limit-${Date.now()}`,
          isBot: true,
          message: `I apologize, but you've reached the maximum token usage limit (${tokenLimit}) for this session.`,
          timestamp: new Date(),
          tokenUsage: {
            total_tokens: 0,
            prompt_tokens: 0,
            completion_tokens: 0
          }
        };
        
        session.messages.push(limitMessage);
        await session.save();
        
        return NextResponse.json(limitMessage);
      }

      // Add bot response to session
      const botMessage = {
        isBot: true,
        message: aiResponse.response,
        timestamp: new Date(),
        tokenUsage: aiResponse.tokenUsage
      };
      
      session.messages.push(botMessage);
      await session.save();
      
      return NextResponse.json(botMessage);
      
    } catch (error) {
      console.error("AI processing error:", error);
      
      // Add error message to session
      const errorMessage = {
        isBot: true,
        message: `Error processing your request: ${error.message}`,
        timestamp: new Date(),
        tokenUsage: {
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0
        }
      };
      
      session.messages.push(errorMessage);
      await session.save();
      
      return NextResponse.json(
        errorMessage,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}