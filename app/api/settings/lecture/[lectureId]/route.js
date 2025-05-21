import { NextResponse } from 'next/server';
import connect  from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const lectureId = params.lectureId;
    const { db } = await connect();
    
    // First get global settings
    const globalSettings = await db.collection('settings').findOne({ type: 'global' }) || {
      allowCopyPaste: true,
      copyPasteLectureOverride: false,
      notifications: {
        email: false,
        flaggedContent: false,
        weeklySummaries: false,
        aiUsageLimits: false,
        contentEdits: false,
      },
      exportFilters: {
        dateRange: 'all',
        course: ''
      }
    };
    
    // Check if lecture-specific settings exist and if overrides are allowed
    if (globalSettings.copyPasteLectureOverride) {
      const lectureSettings = await db.collection('lectureSettings').findOne({ lectureId });
      if (lectureSettings) {
        // Merge with lecture-specific settings taking precedence
        return NextResponse.json({
          ...globalSettings,
          ...lectureSettings,
          isOverridden: true
        });
      }
    }
    
    // Return global settings if no overrides
    return NextResponse.json(globalSettings);
  } catch (error) {
    console.error('Error fetching lecture settings:', error);
    return NextResponse.json({ error: 'Failed to fetch lecture settings' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const lectureId = params.lectureId;
    const settings = await request.json();
    const { db } = await connect();
    
    const result = await db.collection('lectureSettings').updateOne(
      { lectureId },
      { $set: { ...settings, lectureId, updatedAt: new Date() } },
      { upsert: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lecture settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating lecture settings:', error);
    return NextResponse.json({ error: 'Failed to update lecture settings' }, { status: 500 });
  }
}