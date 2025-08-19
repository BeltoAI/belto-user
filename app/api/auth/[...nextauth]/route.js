import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import { sign } from 'jsonwebtoken';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          console.log('Google sign-in attempt for:', profile?.email);
          await connectDB();
          
          // Check if user exists
          let student = await Student.findOne({ email: profile.email });
          
          // If user doesn't exist, create a new one
          if (!student) {
            console.log('Creating new student for:', profile.email);
            student = new Student({
              username: profile.name,
              email: profile.email,
              isVerified: true, // Google accounts are pre-verified
              googleId: profile.sub,
              picture: profile.picture,
              googleAuth: true // Add flag to indicate Google auth
            });
            await student.save();
            console.log('Student created successfully');
          } 
          // If user exists but doesn't have googleId, add it
          else if (!student.googleId) {
            console.log('Linking existing account to Google for:', profile.email);
            student.googleId = profile.sub;
            student.isVerified = true; // Ensure verification
            student.googleAuth = true;
            await student.save();
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          // Return false to trigger an error page with more details
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          id: user.id,
        };
      }
      return token;
    },
    async session({ session, token, user }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',  // Error page
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("User signed in:", user.email);
    },
    async signOut({ session, token }) {
      console.log("User signed out");
    },
    async error(error) {
      console.error("Auth error:", error);
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };