'use client';

import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/hooks/useUser';

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  );
}
