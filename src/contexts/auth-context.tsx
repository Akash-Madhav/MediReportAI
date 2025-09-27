'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { mockUser } from '@/lib/data'; // for mock data

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // For the purpose of this prototype, we'll use a mock user for display
  // until the full backend is implemented.
  displayUser: typeof mockUser | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Use mock user for display purposes
  const displayUser = user ? {
    ...mockUser,
    uid: user.uid,
    displayName: user.displayName || 'Anonymous',
    email: user.email || '',
    photoURL: user.photoURL || mockUser.photoURL,
  } : null;


  return (
    <AuthContext.Provider value={{ user, loading, signOut, displayUser }}>
      {children}
    </AuthContext.Provider>
  );
};
