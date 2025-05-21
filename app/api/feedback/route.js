import { NextResponse } from 'next/server';
import mongoose from 'mongoose';  // Add this import
import dbConnect from '@/lib/db';
import Feedback from '@/models/Feedback';
import Student from '@/models/Student';

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const feedback = await Feedback.create(data);
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    const query = classId ? { classId } : {};
    
    const feedbacks = await Feedback.find(query)
      .populate('studentId', 'username email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
