import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';

export async function GET(request) {
  try {
    console.log('🔍 Database diagnostic started...');
    
    // Test database connection
    await connectDB();
    console.log('✅ Database connection successful');
    
    // Check MongoDB connection state
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log('📊 Connection state:', connectionStates[connectionState] || 'unknown');
    
    // Test basic query
    const sessionCount = await ChatSession.countDocuments();
    console.log('📈 Total chat sessions in database:', sessionCount);
    
    // Test recent session query
    const recentSessions = await ChatSession.find()
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('_id userId title messages.length updatedAt');
    
    console.log('🕒 Recent sessions:', recentSessions.map(s => ({
      id: s._id.toString().substring(0, 8) + '...',
      userId: s.userId?.substring(0, 8) + '...',
      title: s.title,
      messageCount: s.messages?.length || 0,
      lastUpdate: s.updatedAt
    })));
    
    // Test creating a temporary session
    const testSession = new ChatSession({
      userId: 'diagnostic-test-user',
      title: 'Diagnostic Test Session',
      messages: [{
        isBot: false,
        avatar: '',
        name: 'Test User',
        message: 'This is a diagnostic test message',
        timestamp: new Date()
      }]
    });
    
    const savedTest = await testSession.save();
    console.log('✅ Test session created:', savedTest._id.toString().substring(0, 8) + '...');
    
    // Clean up test session
    await ChatSession.findByIdAndDelete(savedTest._id);
    console.log('🧹 Test session cleaned up');
    
    return NextResponse.json({
      status: 'success',
      database: {
        connected: connectionState === 1,
        connectionState: connectionStates[connectionState],
        totalSessions: sessionCount
      },
      recentSessions: recentSessions.map(s => ({
        id: s._id.toString().substring(0, 8) + '...',
        userId: s.userId?.substring(0, 8) + '...',
        messageCount: s.messages?.length || 0,
        lastUpdate: s.updatedAt
      })),
      testOperations: {
        create: 'success',
        delete: 'success'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Database diagnostic failed:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return NextResponse.json({
      status: 'error',
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      database: {
        connected: false,
        connectionState: mongoose.connection.readyState
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
