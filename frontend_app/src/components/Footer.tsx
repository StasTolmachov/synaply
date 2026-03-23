"use client";

import React from 'react';
import { usePathname, Link } from '@/i18n/routing';
import { useTranslation } from './I18nContext';

const Footer = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isLandingPage = pathname === '/' || pathname === '';

  const [year, setYear] = React.useState<number | null>(null);

  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className={`border-t border-gray-200 dark:border-gray-800 p-8 mt-8 text-center text-sm text-gray-600 dark:text-gray-400 ${isLandingPage ? 'bg-white dark:bg-gray-950' : 'bg-transparent'}`}>
      <div className="mb-4">
        <p>© {year || '...'} Synaply. {t('dashboard.all_rights_reserved')}</p>
      </div>
      <div className="mb-4 flex justify-center gap-8">
        <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">{t('dashboard.terms')}</Link>
        <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">{t('common.help')}</Link>
      </div>
      <div className="mb-4">
        <p>
          {t('dashboard.footer_help_text')}
          {' '}
          <a href="mailto:support@synaply.me" className="text-blue-600 dark:text-blue-400 hover:underline">support@synaply.me</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
