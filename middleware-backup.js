import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // For API routes, we need to handle CORS.
    if (pathname.startsWith('/api/')) {
      // For preflight OPTIONS requests, return a response with CORS headers immediately.
      if (req.method === 'OPTIONS') {
        const headers = new Headers();
        const origin = req.headers.get('origin');
        
        const allowedOrigins = [
          'https://belto-user-side.vercel.app',
          'http://localhost:3000',
        ];

        if (origin && allowedOrigins.includes(origin)) {
            headers.set('Access-Control-Allow-Origin', origin);
        }

        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        headers.set('Access-Control-Allow-Credentials', 'true');
        return new Response(null, { status: 204, headers });
      }

      // For other API requests, clone the headers to add CORS headers to the final response.
      const response = NextResponse.next();
      const origin = req.headers.get('origin');
      const allowedOrigins = [
        'https://belto-user-side.vercel.app',
        'http://localhost:3000',
      ];
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      return response;
    }

    // For non-API routes, just continue.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow all requests to the auth API routes (for login, logout, etc.)
        if (pathname.startsWith('/api/auth/')) {
          return true;
        }

        // For any other API route, a token is required.
        if (pathname.startsWith('/api/')) {
          // Check for the default NextAuth token OR a custom 'token' cookie.
          const nextAuthToken = !!token;
          const customToken = req.cookies.get('token')?.value;
          return nextAuthToken || !!customToken;
        }

        // For all non-API pages, allow access.
        // Page-level protection should be handled in the page components.
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/api/:path*',
    '/main/:path*',
    '/chat/:path*',
    '/classes/:path*',
    '/account/:path*'
  ]
}
