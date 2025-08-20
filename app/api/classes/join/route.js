import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Class from '@/models/Class';

export async function POST(request) {
  try {
    console.log('POST /api/classes/join - Starting request processing');
    
    // Connect to database
    await connectDB();
    console.log('Database connection successful');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', { studentId: body.studentId, classCode: body.classCode });
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    const { studentId, classCode } = body;

    // Validate required fields
    if (!studentId || !classCode) {
      console.log('Missing required fields:', { studentId: !!studentId, classCode: !!classCode });
      return NextResponse.json(
        { error: 'Missing required fields: studentId and classCode are required' },
        { status: 400 }
      );
    }

    // Validate studentId format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.log('Invalid studentId format:', studentId);
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      );
    }

    console.log('Finding class with enrollment code:', classCode);
    
    // Find the class by enrollment code
    const classDoc = await Class.findOne({ enrollmentCode: classCode });
    console.log('Class search result:', classDoc ? `Found class: ${classDoc.name}` : 'Class not found');

    if (!classDoc) {
      return NextResponse.json(
        { error: 'Class not found with this enrollment code' },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    const isAlreadyEnrolled = classDoc.students.some(id => id.toString() === studentId.toString());
    console.log('Student already enrolled check:', isAlreadyEnrolled);
    
    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }

    console.log('Adding student to class...');
    
    // Add student to the class
    classDoc.students.push(new mongoose.Types.ObjectId(studentId));
    
    console.log('Saving class document...');
    await classDoc.save();
    console.log('Class saved successfully');

    const responseData = {
      message: 'Successfully joined the class',
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        description: classDoc.description,
        enrollmentCode: classDoc.enrollmentCode,
        startDate: classDoc.startDate,
        status: classDoc.status,
      }
    };
    
    console.log('Sending successful response:', responseData);
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error in POST /api/classes/join - Full error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'An internal server error occurred while trying to join the class.',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}
