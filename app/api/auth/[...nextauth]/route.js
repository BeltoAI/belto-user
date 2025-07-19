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
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          await connectDB();
          
          // Check if user exists
          let student = await Student.findOne({ email: profile.email });
          
          // If user doesn't exist, create a new one
          if (!student) {
            student = new Student({
              username: profile.name,
              email: profile.email,
              isVerified: true, // Google accounts are pre-verified
              googleId: profile.sub,
              picture: profile.picture
            });
            await student.save();
          } 
          // If user exists but doesn't have googleId, add it
          else if (!student.googleId) {
            student.googleId = profile.sub;
            student.isVerified = true; // Ensure verification
            await student.save();
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
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