import React from 'react';
import HelpPageClient from './HelpPageClient';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const tHelp = await getTranslations({ locale, namespace: 'help' });
  
  return {
    title: `${tHelp('title')} | WordsGo`,
    description: 'Learn how to use WordsGo effectively with our help guide.',
  };
}

export default function HelpPage() {
  return <HelpPageClient />;
}
