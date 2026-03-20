import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WordsGo',
    short_name: 'WordsGo',
    description: 'Learn new words with spaced repetition. The easiest way to expand your vocabulary.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#030712', // gray-950
    theme_color: '#3b82f6',      // blue-500
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
