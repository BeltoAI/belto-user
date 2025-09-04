import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import Class from '@/models/Class';
import Lecture from '@/models/Lecture';

export async function GET(request, { params }) {
  try {
    // Wait for params to be available
    const { classId } = await params;

    console.log('📚 Fetching lectures for class:', classId);

    if (!mongoose.isValidObjectId(classId)) {
      console.error('❌ Invalid class ID format:', classId);
      return NextResponse.json(
        { error: 'Invalid class ID format' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find the class and populate lectures with full details
    const classData = await Class.findById(classId)
      .populate({
        path: 'lectures',
        select: 'title description startDate endDate status materials'
      })
      .lean();

    if (!classData) {
      console.error('❌ Class not found:', classId);
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    const lectures = classData.lectures || [];
    console.log('✅ Found lectures:', lectures.map(l => ({ id: l._id, title: l.title })));

    return NextResponse.json({ 
      lectures: lectures
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Error fetching lecture titles:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
