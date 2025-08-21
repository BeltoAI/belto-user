import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';
import connectDB from '@/lib/db';
import Student from '@/models/Student';

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

    // Handle profile image upload - Convert to Base64 for Vercel compatibility
    let profileImagePath = user.profileImage;
    if (profileImage && profileImage instanceof File && profileImage.size > 0) {
      try {
        // Check file size (limit to 2MB for Base64 storage)
        if (profileImage.size > 2 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Image size must be less than 2MB' },
            { status: 400 }
          );
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(profileImage.type)) {
          return NextResponse.json(
            { error: 'Only JPEG, PNG, and WebP images are allowed' },
            { status: 400 }
          );
        }

        // Convert to Base64
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString('base64');
        profileImagePath = `data:${profileImage.type};base64,${base64String}`;
        
        console.log('Profile image converted to Base64, size:', profileImagePath.length);
      } catch (error) {
        console.error('Error processing profile image:', error);
        return NextResponse.json(
          { error: 'Failed to process profile image' },
          { status: 500 }
        );
      }
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

    console.log('User profile updated successfully, profileImage length:', updatedUser.profileImage?.length || 0);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
