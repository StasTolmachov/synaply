import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PublicListsClient from './PublicListsClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tLists = await getTranslations({ locale, namespace: 'dashboard.public_lists' });
  const baseUrl = "https://wordsgo.tolmachov.dev";

  return {
    title: `${tLists('title')} | WordsGo`,
    description: tLists('subtitle'),
    alternates: {
      canonical: `${baseUrl}/${locale}/public-lists`,
    },
    openGraph: {
      title: `${tLists('title')} | WordsGo`,
      description: tLists('subtitle'),
      url: `${baseUrl}/${locale}/public-lists`,
      type: 'website',
    },
  };
}

export default function PublicListsPage() {
  return <PublicListsClient />;
}
