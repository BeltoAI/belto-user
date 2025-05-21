import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// Define Class Schema if not already defined elsewhere
const ClassSchema = new mongoose.Schema({
  name: String,
  lectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture'
  }]
});

// Define Lecture Schema if not already defined elsewhere
const LectureSchema = new mongoose.Schema({
  title: String
});

// Get or create models
const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
const Lecture = mongoose.models.Lecture || mongoose.model('Lecture', LectureSchema);

export async function GET(request, { params }) {
  try {
    // Wait for params to be available
    const { classId } = await params;

    if (!mongoose.isValidObjectId(classId)) {
      return NextResponse.json(
        { error: 'Invalid class ID format' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find the class and populate lectures
    const classData = await Class.findById(classId)
      .populate('lectures', 'title')
      .lean();

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      lectures: classData.lectures || [] 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching lecture titles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
