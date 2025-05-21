import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Session from '@/models/Chat';
import Lecture from '@/models/Lecture';

export async function GET(request) {
  await connectDB();
  
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }
  
  try {
    // Find the session
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Check if this session is linked to a lecture
    const lecture = await Lecture.findOne({ sessionId: session._id });
    
    if (!lecture) {
      return NextResponse.json({ 
        isLectureSession: false 
      });
    }
    
    // Return lecture details
    return NextResponse.json({
      isLectureSession: true,
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        classId: lecture.classId
      }
    });
    
  } catch (error) {
    console.error('Error checking lecture session:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}