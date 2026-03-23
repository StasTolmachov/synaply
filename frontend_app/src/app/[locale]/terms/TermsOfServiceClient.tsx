'use client';

import React from 'react';
import { useTranslation } from '@/components/I18nContext';

const TermsOfServiceClient = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold synaply-gradient-text mb-4">{t('profile.terms_title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('profile.terms_last_updated')}</p>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-6 mb-10 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">Beta Warning</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  <p>{t('profile.terms_beta_warning')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10 prose dark:prose-invert max-w-none">
            {[
              { title: 'intro_title', text: 'intro_text' },
              { title: 'beta_title', text: 'beta_text' },
              { title: 'accounts_title', text: 'accounts_text' },
              { title: 'content_title', text: 'content_text' },
              { title: 'conduct_title', text: 'conduct_text' },
              { title: 'liability_title', text: 'liability_text' },
              { title: 'changes_title', text: 'changes_text' },
              { title: 'contact_title', text: 'contact_text' }
            ].map((section, index) => (
              <div key={index} className="group">
                <h2 className="text-xl font-bold text-synaply-blue dark:text-synaply-cyan mb-4 flex items-center group-hover:translate-x-1 transition-transform">
                  <span className="w-1.5 h-6 bg-synaply-blue dark:bg-synaply-cyan rounded-full mr-3 shadow-sm" />
                  {t(`profile.terms_${section.title}`)}
                </h2>
                <div className="text-gray-600 dark:text-gray-300 text-base leading-relaxed pl-4.5">
                  <p>{t(`profile.terms_${section.text}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceClient;
