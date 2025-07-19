import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create unique filename
    const fileName = `profile_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to public/uploads directory
    const path = join(process.cwd(), 'public', 'uploads', fileName);
    await writeFile(path, buffer);

    // Update user profile with new image path
    const profilePicturePath = `/uploads/${fileName}`;
    
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { profilePicture: profilePicturePath } },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePicturePath,
      user 
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
  }
}
