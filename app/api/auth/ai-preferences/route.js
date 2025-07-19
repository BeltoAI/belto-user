import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch user AI preferences
export async function GET() {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize AI preferences if they don't exist
    if (!user.aiPreferences) {
      user.aiPreferences = {
        preRules: [],
        postRules: [],
        personalityTone: 'friendly',
        customTone: '',
        enablePersonalization: true
      };
      await user.save();
    }

    return NextResponse.json({ aiPreferences: user.aiPreferences });
  } catch (error) {
    console.error('Error fetching user AI preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch AI preferences' }, { status: 500 });
  }
}

// PUT - Update user AI preferences
export async function PUT(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { aiPreferences } = await request.json();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update AI preferences
    user.aiPreferences = {
      preRules: aiPreferences.preRules || [],
      postRules: aiPreferences.postRules || [],
      personalityTone: aiPreferences.personalityTone || 'friendly',
      customTone: aiPreferences.customTone || '',
      enablePersonalization: aiPreferences.enablePersonalization !== undefined ? aiPreferences.enablePersonalization : true
    };

    await user.save();

    return NextResponse.json({ 
      message: 'AI preferences updated successfully', 
      aiPreferences: user.aiPreferences 
    });
  } catch (error) {
    console.error('Error updating user AI preferences:', error);
    return NextResponse.json({ error: 'Failed to update AI preferences' }, { status: 500 });
  }
}
