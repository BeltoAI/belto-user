"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        console.log('UserContext: Fetched user data:', { 
          username: userData.username, 
          hasProfileImage: !!(userData.profileImage && userData.profileImage.trim() !== ''),
          profileImageLength: userData.profileImage ? userData.profileImage.length : 0
        });
        setUser(userData);
      } else if (response.status === 401) {
        setUser(null);
        // Don't redirect from here, let individual pages handle it
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    console.log('UserContext: Updating user with new data:', updatedUser);
    setUser(updatedUser);
  };

  const refreshUser = () => {
    setLoading(true);
    fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    updateUser,
    refreshUser,
    fetchUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
