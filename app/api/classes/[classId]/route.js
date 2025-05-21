import { NextResponse } from "next/server";
import Class from '@/models/Class';
import dbConnect from '@/lib/db';

export async function GET(request, context) {
  try {
    const { params } = context;
    const classId = params.classId;
    
    await dbConnect();
    const classDetails = await Class.findById(classId);
    
    if (!classDetails) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(classDetails, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}