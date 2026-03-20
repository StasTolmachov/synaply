"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Footer = () => {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <footer style={{
      borderTop: '1px solid #ccc',
      padding: '2rem',
      marginTop: '2rem',
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#555',
      backgroundColor: isLandingPage ? 'white' : 'transparent'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <p>© {new Date().getFullYear()} WordsGo. A project by Tolmachov.dev. All rights reserved.</p>
      </div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <Link href="/terms" style={{ color: '#555', textDecoration: 'none' }}>Terms of Service</Link>
        <Link href="/help" style={{ color: '#555', textDecoration: 'none' }}>Help</Link>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <p>
          Help us improve! &gt; Share your ideas, report bugs, or request features:
          {' '}
          <a href="mailto:wordsgo@tolmachov.dev" style={{ color: '#3030F1' }}>wordsgo@tolmachov.dev</a>
        </p>
      </div>

    </footer>
  );
};

export default Footer;
