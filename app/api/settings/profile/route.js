import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const token = getTokenFromCookie(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAuth(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await Student.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data including extended fields
    const profileData = {
      fullName: user.fullName || user.username,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      veterinarianStatus: user.veterinarianStatus || '',
      disabilityStatus: user.disabilityStatus || '',
      ethnicity: user.ethnicity || '',
      profileImage: user.profileImage || null
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const token = getTokenFromCookie(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAuth(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await Student.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    // Extract form fields
    const fullName = formData.get('fullName');
    const username = formData.get('username');
    const phoneNumber = formData.get('phoneNumber');
    const dateOfBirth = formData.get('dateOfBirth');
    const gender = formData.get('gender');
    const veterinarianStatus = formData.get('veterinarianStatus');
    const disabilityStatus = formData.get('disabilityStatus');
    const ethnicity = formData.get('ethnicity');
    const profileImage = formData.get('profileImage');

    // Handle profile image upload
    let profileImagePath = user.profileImage;
    if (profileImage && profileImage instanceof File && profileImage.size > 0) {
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(profileImage.name);
      const fileName = `profile_${decoded.userId}_${timestamp}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file
      await writeFile(filePath, buffer);
      profileImagePath = `/uploads/profiles/${fileName}`;
    }

    // Update user profile
    const updatedUser = await Student.findByIdAndUpdate(
      decoded.userId,
      {
        fullName: fullName || user.fullName,
        username: username || user.username,
        phoneNumber: phoneNumber || '',
        dateOfBirth: dateOfBirth || null,
        gender: gender || '',
        veterinarianStatus: veterinarianStatus || '',
        disabilityStatus: disabilityStatus || '',
        ethnicity: ethnicity || '',
        profileImage: profileImagePath
      },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
