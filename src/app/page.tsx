'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
        </div>
    );
  }

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
