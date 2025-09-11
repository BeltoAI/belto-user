import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

// This is the main middleware function that will be wrapped by withAuth.
// It runs *after* the `authorized` callback confirms the user is authenticated.
function middleware(req) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin');
  
  const allowedOrigins = [
    'https://belto-user-side.vercel.app',
    'http://localhost:3000',
  ];

  // For API routes, we handle CORS.
  if (pathname.startsWith('/api/')) {
    // For preflight OPTIONS requests, we send back the CORS headers immediately.
    if (req.method === 'OPTIONS') {
      const headers = new Headers();
      if (origin && allowedOrigins.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
      }
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      headers.set('Access-Control-Allow-Credentials', 'true');
      return new Response(null, { status: 204, headers });
    }

    // For other API requests, we let the request proceed and add CORS headers to the final response.
    const response = NextResponse.next();
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  }

  // For all non-API routes, we just let the request proceed.
  return NextResponse.next();
}

// Wrap the main middleware function with withAuth.
export default withAuth(middleware, {
  callbacks: {
    // The `authorized` callback determines if a user is allowed to access a route.
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;

      // Always allow requests to the authentication API routes (e.g., for login).
      if (pathname.startsWith('/api/auth/')) {
        return true;
      }

      // For any other API route, the user must be authenticated.
      if (pathname.startsWith('/api/')) {
        // `token` will be present if the user has a valid NextAuth session.
        return !!token;
      }

      // For all non-API pages, we allow access. 
      // Page-level protection can be handled within the page components themselves.
      return true;
    },
  },
});

// The `config` object specifies which routes the middleware should run on.
export const config = {
  matcher: [
    '/api/:path*',
    '/main/:path*',
    '/chat/:path*',
    '/classes/:path*',
    '/account/:path*'
  ]
};
