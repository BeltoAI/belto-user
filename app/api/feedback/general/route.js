import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GeneralFeedback from '@/models/GeneralFeedback';

// --- POST Method (Existing) ---
export async function POST(request) {
  await connectDB();

  try {
    // 1. Parse Request Body
    const body = await request.json();
    const { email, q1_helpfulness, q2_frustrations, q3_improvement } = body;

    // 2. Validate Input (including email)
    if (!email || !q1_helpfulness || !q2_frustrations || !q3_improvement) {
      return NextResponse.json({ error: 'Email and all feedback questions must be provided.' }, { status: 400 });
    }

    // Optional: Add more robust email format validation here if needed

    // 3. Create Feedback Document
    const newFeedback = new GeneralFeedback({
      email,
      q1_helpfulness,
      q2_frustrations,
      q3_improvement,
    });

    // 4. Save to Database
    await newFeedback.save();

    // 5. Return Success Response
    return NextResponse.json({ message: 'Feedback submitted successfully!' }, { status: 201 });

  } catch (error) {
    console.error('Error submitting general feedback:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return NextResponse.json({ error: `Validation failed: ${messages.join(', ')}` }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    if (error.name === 'MongoNetworkError') {
         return NextResponse.json({ error: 'Database connection error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An error occurred while submitting feedback.' }, { status: 500 });
  }
}

// --- GET Method (New) ---
export async function GET(request) {
  await connectDB();

  try {
    // 1. Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // 2. Validate if email is provided
    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required.' }, { status: 400 });
    }

    // 3. Find feedback by email (case-insensitive search using regex)
    // Using lowercase from the model ensures consistency, but regex handles potential variations if needed.
    const feedbackEntries = await GeneralFeedback.find({
        email: { $regex: new RegExp(`^${email}$`, 'i') } // Case-insensitive exact match
    }).sort({ createdAt: -1 }); // Optional: sort by newest first

    // 4. Return found feedback or empty array
    return NextResponse.json(feedbackEntries, { status: 200 });

  } catch (error) {
    console.error('Error fetching general feedback:', error);
     if (error.name === 'MongoNetworkError') {
         return NextResponse.json({ error: 'Database connection error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An error occurred while fetching feedback.' }, { status: 500 });
  }
}