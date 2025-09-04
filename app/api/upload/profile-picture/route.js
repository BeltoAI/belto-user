import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyAuth } from '@/midldleware/authMiddleware';
import connectDB from '@/lib/db';
import Student from '@/models/Student';

// Accepts either JSON { base64: 'data:image/...;base64,...' } or multipart/form-data with 'file'
export async function POST(request) {
	try {
		const token = getTokenFromCookie(request);
		if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const decoded = verifyAuth(token);
		if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

		await connectDB();
		const user = await Student.findById(decoded.userId);
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		let base64DataUrl = '';
		const contentType = request.headers.get('content-type') || '';

		if (contentType.includes('application/json')) {
			const body = await request.json();
			base64DataUrl = body.base64 || '';
		} else if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = formData.get('file');
			if (file && file instanceof File && file.size > 0) {
				if (file.size > 2 * 1024 * 1024) {
					return NextResponse.json({ error: 'Image size must be less than 2MB' }, { status: 400 });
				}
				const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
				if (!allowed.includes(file.type)) {
					return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
				}
				const bytes = await file.arrayBuffer();
				const buffer = Buffer.from(bytes);
				const base64 = buffer.toString('base64');
				base64DataUrl = `data:${file.type};base64,${base64}`;
			}
		} else {
			return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
		}

		if (!base64DataUrl || !base64DataUrl.startsWith('data:image/')) {
			return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
		}

		user.profileImage = base64DataUrl;
		await user.save();

		const result = await Student.findById(user._id).select('-password');
		return NextResponse.json(result);
	} catch (err) {
		console.error('Profile picture upload error:', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
