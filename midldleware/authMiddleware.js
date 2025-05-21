// middleware/authMiddleware.js
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function getTokenFromCookie(request) {
    const token = request.cookies.get('token')?.value;
    return token;
}

export function verifyAuth(token) {
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function authMiddleware(request, next) {
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

    return next(request);
}

export default authMiddleware;