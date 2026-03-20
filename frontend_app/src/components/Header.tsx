"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useScore } from './ScoreContext';
import { usePathname, useRouter } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';
import { LogOut, HelpCircle, User, WifiOff } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { score } = useScore();
  const pathname = usePathname();
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isHelpPage = pathname === '/help';

  if (isAuthPage || isLandingPage) {
    return null;
  }

  const handleLogout = () => {
    sendGAEvent('event', 'logout', {});
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center group">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-500">WordsGo</span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded">Beta</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {isOffline && (
              <div className="flex items-center text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-xs font-medium animate-pulse border border-amber-100 dark:border-amber-900/50">
                <WifiOff className="w-3.5 h-3.5 mr-1.5" />
                Offline Mode
              </div>
            )}
            <ThemeToggle />
            {!isHelpPage && (
              <Link
                href="/help"
                target="_blank"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center text-sm font-medium transition-colors"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Help
              </Link>
            )}
            <Link
              href="/profile"
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center text-sm font-medium transition-colors"
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Link>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm">
              Score: <span className="font-bold text-blue-700 dark:text-blue-400">{score}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center text-sm font-medium transition-colors"
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