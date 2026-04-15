'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    try {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.email) {
            router.push('/admin');
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      // If there's any error with localStorage, redirect to login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-3xl flex items-center justify-center">
          <span className="text-white font-bold text-4xl">OF</span>
        </div>
      </div>
      <p className="text-gray-600">Redirecting...</p>
    </div>
  )
}