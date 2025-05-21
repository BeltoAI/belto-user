import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Class from '@/models/Class';
import Setting from '@/models/Setting';
import mongoose from 'mongoose';

/**
 * Fetches a professor's settings for a specific class
 * 
 * This route gets a class by ID, then finds the settings 
 * associated with the professor who owns that class.
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    
    // Find the class to get professor ID
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    
    const professorId = classData.professorId;
    
    // Find settings where userId matches the professorId
    const professorSettings = await Setting.findOne({
      userId: professorId
    });
    
    if (!professorSettings) {
      return NextResponse.json({ 
        error: "No settings found for this professor",
        // Return default settings as fallback
        defaultSettings: {
          allowCopyPaste: true,
          copyPasteLectureOverride: false,
          notifications: {
            email: false,
            flaggedContent: false,
            weeklySummaries: false,
            aiUsageLimits: false,
            contentEdits: false
          },
          exportFilters: {
            dateRange: 'all',
            course: ''
          }
        }
      }, { status: 404 });
    }
    
    return NextResponse.json(professorSettings);
    
  } catch (error) {
    console.error("Error fetching professor settings:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch professor settings" }, { status: 500 });
  }
}

/**
 * Alternative route that takes studentId and finds the settings
 * for all professors whose classes the student is enrolled in
 */
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { studentId } = body;
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }
    
    // Find all classes the student is enrolled in
    const enrolledClasses = await Class.find({
      students: new mongoose.Types.ObjectId(studentId)
    });
    
    if (enrolledClasses.length === 0) {
      return NextResponse.json({ error: "No classes found for this student" }, { status: 404 });
    }
    
    // Extract all professor IDs
    const professorIds = enrolledClasses.map(cls => cls.professorId);
    
    // Find settings for all professors
    const professorSettings = await Setting.find({
      userId: { $in: professorIds }
    });
    
    // Create a map of professorId to settings
    const settingsMap = {};
    
    professorSettings.forEach(setting => {
      settingsMap[setting.userId.toString()] = setting;
    });
    
    // Map settings to classes
    const classSettings = enrolledClasses.map(cls => {
      const professorId = cls.professorId.toString();
      return {
        classId: cls._id,
        className: cls.name,
        professorId: professorId,
        settings: settingsMap[professorId] || null
      };
    });
    
    return NextResponse.json({ classSettings });
    
  } catch (error) {
    console.error("Error fetching professor settings:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch professor settings" }, { status: 500 });
  }
}