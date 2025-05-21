import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Class from '@/models/Class';
import mongoose from 'mongoose';

// Fetch joined classes for a student by their ID.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    await connectDB();

    const classes = await Class.find({
      students: new mongoose.Types.ObjectId(studentId)
    });

    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}