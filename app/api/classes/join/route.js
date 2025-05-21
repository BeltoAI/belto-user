import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Class from '@/models/Class';

export async function POST(request) {
  try {
    await connectDB();
    const { studentId, classCode } = await request.json();

    if (!studentId || !classCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the class by enrollment code
    const classDoc = await Class.findOne({ enrollmentCode: classCode });

    if (!classDoc) {
      return NextResponse.json(
        { error: 'Class not found with this enrollment code' },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    if (classDoc.students.includes(studentId)) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }

    // Add student to the class
    classDoc.students.push(studentId);
    await classDoc.save();

    return NextResponse.json({
      message: 'Successfully joined the class',
      class: {
        id: classDoc._id,
        name: classDoc.name,
        description: classDoc.description,
        enrollmentCode: classDoc.enrollmentCode,
        joinDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json(
      { error: 'Failed to join class' },
      { status: 500 }
    );
  }
}
