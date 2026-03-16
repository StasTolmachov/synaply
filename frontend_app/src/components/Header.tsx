"use client";

import React from 'react';
import Link from 'next/link';
import { useScore } from './ScoreContext';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function Header() {
  const { score } = useScore();
  const pathname = usePathname();
  const router = useRouter();

  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage || isLandingPage) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center group">
              <span className="text-xl font-bold text-blue-600">WordsGo</span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 rounded">Beta</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm font-medium text-gray-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
              Score: <span className="font-bold text-blue-700">{score}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 flex items-center text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}