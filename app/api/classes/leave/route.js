import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Class from '@/models/Class';
import mongoose from 'mongoose';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    if (!classId || !studentId) {
      return NextResponse.json({ error: "Class ID and Student ID are required" }, { status: 400 });
    }

    await connectDB();

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $pull: { students: new mongoose.Types.ObjectId(studentId) } },
      { new: true }
    );

    if (!updatedClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Successfully left the class" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}