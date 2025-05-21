import { NextResponse } from 'next/server';
import connect  from '@/lib/db';
import { ObjectId } from 'mongodb';

// Get global settings
export async function GET(request) {
  try {
    const { db } = await connect();
    const settings = await db.collection('settings').findOne({ type: 'global' }) || {
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
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// Update global settings
export async function PUT(request) {
  try {
    const settings = await request.json();
    const { db } = await connect();
    
    const result = await db.collection('settings').updateOne(
      { type: 'global' },
      { $set: { ...settings, type: 'global', updatedAt: new Date() } },
      { upsert: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}