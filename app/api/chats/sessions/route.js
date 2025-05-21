import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/Chat';
import Lecture from '@/models/Lecture'; // <-- new import

export async function GET(request) {
  try {
    await connectDB();
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');
    const lectureId = searchParams.get('lectureId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Build query based on provided parameters
    const query = { userId };
    if (lectureId) {
      query.lectureId = lectureId;
    }

    const sessions = await ChatSession.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Format the response data
    const formattedSessions = sessions.map(session => ({
      ...session,
      _id: session._id.toString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map(msg => ({
        ...msg,
        _id: msg._id.toString(),
        timestamp: msg.timestamp.toISOString()
      }))
    }));

    return NextResponse.json({ sessions: formattedSessions });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, lectureId } = body;

    // Debug log to check incoming data
    console.log('Received request body:', body);

    if (!userId || !lectureId) {
      return NextResponse.json({ 
        error: 'User ID and Lecture ID are required' 
      }, { status: 400 });
    }

    // Check existing session
    const existingSession = await ChatSession.findOne({ userId, lectureId });
    
    if (existingSession) {
      return NextResponse.json({ 
        error: 'A session already exists for this user and lecture' 
      }, { status: 409 });
    }

    // Fetch lecture to get its title
    const lecture = await Lecture.findById(lectureId);
    const lectureTitle = lecture ? lecture.title : 'Lecture Session';

    const sessionData = {
      userId,
      lectureId,
      title: lectureTitle
    };

    // Debug log to verify session data
    console.log('Creating session with data:', sessionData);

    // Create new session
    const newSession = await ChatSession.create(sessionData);

    // Debug log to verify created session
    console.log('Created session:', newSession);

    // Format response
    const formattedSession = {
      ...newSession.toObject(),
      _id: newSession._id.toString(),
      lectureId: newSession.lectureId, // Explicitly include in formatted response
      createdAt: newSession.createdAt.toISOString(),
      updatedAt: newSession.updatedAt.toISOString(),
      messages: newSession.messages.map(msg => ({
        ...msg,
        _id: msg._id.toString(),
        timestamp: msg.timestamp.toISOString()
      }))
    };

    return NextResponse.json({ session: formattedSession });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session. Error: ' + error.message },
      { status: 500 }
    );
  }
}