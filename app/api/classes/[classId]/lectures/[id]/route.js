import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Lecture from "@/models/Lecture";
import User from "@/models/User"; // Add this import to register User model

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { classId, id } = params;
    console.log("Fetching lecture:", { classId, id });

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/) || !classId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Find the lecture and populate relevant fields
    const lecture = await Lecture.findOne({
      _id: id,
      classId: classId
    })
    .populate({
      path: 'attendance.student',
      model: 'User',
      select: 'name email'
    })
    .lean();

    if (!lecture) {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lecture);

  } catch (error) {
    // Better error logging
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { error: error.message || "Error getting lecture details" },
      { status: 500 }
    );
  }
}
