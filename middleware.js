import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      
      // Allow necessary origins
      const allowedOrigins = [
        'https://belto-user-side.vercel.app',
        'http://localhost:3000',
      ]
      
      const origin = req.headers.get('origin')
      if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Protection')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      
      return response
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // For API auth routes, always allow
        if (req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true
        }
        
        // For other protected API routes, require authentication
        if (req.nextUrl.pathname.startsWith('/api/')) {
          // Check for custom JWT token in cookies or NextAuth session
          const customToken = req.cookies.get('token')?.value
          const nextAuthToken = token
          
          return !!(customToken || nextAuthToken)
        }
        
        // For page routes, handle differently
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/api/:path*',
    '/main/:path*',
    '/chat/:path*',
    '/classes/:path*',
    '/account/:path*'
  ]
}
