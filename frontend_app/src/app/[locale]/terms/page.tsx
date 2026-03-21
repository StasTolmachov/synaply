import React from 'react';
import TermsOfServiceClient from './TermsOfServiceClient';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  
  return {
    title: `${t('terms')} | WordsGo`,
    description: 'Terms of Service and Privacy Policy for WordsGo.',
  };
}

const TermsOfService = () => {
  return <TermsOfServiceClient />;
};

export default TermsOfService;
