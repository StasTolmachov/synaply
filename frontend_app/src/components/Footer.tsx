"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Footer = () => {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <footer className={`border-t border-gray-200 dark:border-gray-800 p-8 mt-8 text-center text-sm text-gray-600 dark:text-gray-400 ${isLandingPage ? 'bg-white dark:bg-gray-950' : 'bg-transparent'}`}>
      <div className="mb-4">
        <p>© {new Date().getFullYear()} WordsGo. A project by Tolmachov.dev. All rights reserved.</p>
      </div>
      <div className="mb-4 flex justify-center gap-8">
        <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">Terms of Service</Link>
        <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">Help</Link>
      </div>
      <div className="mb-4">
        <p>
          Help us improve! &gt; Share your ideas, report bugs, or request features:
          {' '}
          <a href="mailto:wordsgo@tolmachov.dev" className="text-blue-600 dark:text-blue-400 hover:underline">wordsgo@tolmachov.dev</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
