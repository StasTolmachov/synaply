import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PublicListDetailClient from './PublicListDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

async function getPublicList(id: string) {
  try {
    const response = await fetch(`${API_BASE}/public-lists/${id}`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching public list for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string, locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params;
  const list = await getPublicList(id);
  
  if (!list) {
    return {
      title: 'List Not Found | WordsGo',
    };
  }

  const baseUrl = "https://wordsgo.tolmachov.dev";

  return {
    title: `${list.title} | WordsGo`,
    description: list.description || `Explore this public word list: ${list.title} (${list.source_lang} to ${list.target_lang})`,
    alternates: {
      canonical: `${baseUrl}/${locale}/public-lists/${id}`,
    },
    openGraph: {
      title: `${list.title} | WordsGo`,
      description: list.description,
      url: `${baseUrl}/${locale}/public-lists/${id}`,
      type: 'article',
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: list.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${list.title} | WordsGo`,
      description: list.description,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function PublicListDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params;
  const list = await getPublicList(id);

  const jsonLd = list ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.title,
    description: list.description,
    numberOfItems: list.words?.length || 0,
    itemListElement: (list.words || []).slice(0, 10).map((word: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: word.original,
      description: word.translation,
    })),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PublicListDetailClient id={id} />
    </>
  );
}
