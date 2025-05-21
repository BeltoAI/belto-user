import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Class from '@/models/Class';

export async function POST(request) {
  try {
    await connectDB();
    const { classUrl } = await request.json();

    if (!classUrl) {
      return NextResponse.json(
        { error: 'Missing class URL' },
        { status: 400 }
      );
    }

    const enrollmentCode = classUrl.split('/').pop();
    const classDoc = await Class.findOne({ enrollmentCode });

    if (!classDoc) {
      return NextResponse.json(
        { error: 'Invalid class URL' },
        { status: 404 }
      );
    }

    if (classDoc.status !== 'active') {
      return NextResponse.json(
        { error: 'This class is no longer active' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      className: classDoc.name
    });
  } catch (error) {
    console.error('Error validating class URL:', error);
    return NextResponse.json(
      { error: 'Failed to validate class URL' },
      { status: 500 }
    );
  }
}
