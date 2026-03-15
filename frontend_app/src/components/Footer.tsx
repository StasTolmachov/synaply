import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid #ccc',
      padding: '2rem',
      marginTop: '2rem',
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#555'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <p>© 2026 WordsGo. A project by Tolmachov.dev. All rights reserved.</p>
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
