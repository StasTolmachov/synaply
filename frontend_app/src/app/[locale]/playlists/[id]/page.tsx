'use client';

import { use } from 'react';
import PlaylistDetailClient from './PlaylistDetailClient';

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id } = use(params);
  return <PlaylistDetailClient id={id} />;
}
