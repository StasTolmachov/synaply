import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PublicListsClient from './PublicListsClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const tLists = await getTranslations({ locale, namespace: 'dashboard.public_lists' });

  return {
    title: `${tLists('title')} | WordsGo`,
    description: tLists('subtitle'),
    openGraph: {
      title: `${tLists('title')} | WordsGo`,
      description: tLists('subtitle'),
      type: 'website',
    },
  };
}

export default function PublicListsPage() {
  return <PublicListsClient />;
}
