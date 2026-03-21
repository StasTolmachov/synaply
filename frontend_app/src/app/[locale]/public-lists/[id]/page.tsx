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

  return {
    title: `${list.title} | WordsGo`,
    description: list.description || `Explore this public word list: ${list.title} (${list.source_lang} to ${list.target_lang})`,
    openGraph: {
      title: `${list.title} | WordsGo`,
      description: list.description,
      type: 'article',
    },
  };
}

export default async function PublicListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicListDetailClient id={id} />;
}
