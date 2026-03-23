import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://synaply.me';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/profile/',
        '/lesson/',
        '/practice/',
        '/login',
        '/register',
        '/*/dashboard/',
        '/*/profile/',
        '/*/lesson/',
        '/*/practice/',
        '/*/login',
        '/*/register',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
