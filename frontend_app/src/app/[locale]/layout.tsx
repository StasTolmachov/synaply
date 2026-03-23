import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";
import { ScoreProvider } from "@/components/ScoreContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { I18nProvider } from "@/components/I18nContext";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { languages } from '@/lib/languages';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'metadata' });

  // Генерация ссылок hreflang для всех 114 языков
  const baseUrl = "https://synaply.me";
  const languageAlternates: Record<string, string> = {};
  
  Object.keys(languages).forEach((langCode) => {
    const code = langCode.toLowerCase();
    const url = code === 'en' ? baseUrl : `${baseUrl}/${code}`;
    languageAlternates[code] = url;
  });

  // Добавляем x-default (fallback на английский)
  languageAlternates['x-default'] = baseUrl;

  // Специфические для Next.js настройки Open Graph локали
  const ogLocales: Record<string, string> = {
    'en': 'en_US',
    'ru': 'ru_RU',
    'uk': 'uk_UA'
  };

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(','),
    authors: [{ name: "Synaply Team" }],
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://synaply.me'),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Synaply",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico?v=2", type: "image/x-icon" },
        { url: "/favicon.png?v=2", type: "image/png" },
        { url: "/favicon.png?v=2", type: "image/png", rel: "shortcut icon" }
      ],
      apple: "/apple-icon.png?v=2",
    },
    openGraph: {
      title: t('og_title') || t('title'),
      description: t('og_description') || t('description'),
      url: locale === 'en' ? baseUrl : `${baseUrl}/${locale}`,
      siteName: "Synaply",
      locale: ogLocales[locale] || locale,
      type: "website",
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: t('og_image_alt') || "Synaply AI Language Learning",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t('twitter_title') || t('title'),
      description: t('twitter_description') || t('description'),
      creator: "@SynaplyTeam",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: locale === 'en' ? baseUrl : `${baseUrl}/${locale}`,
      languages: languageAlternates,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Проверяем, что локаль поддерживается
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Получаем сообщения для провайдера
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme');
                const root = document.documentElement;
                
                // Theme initialization
                root.classList.remove('light', 'dark');
                let theme = 'light';
                if (savedTheme === 'dark') {
                  theme = 'dark';
                } else if (savedTheme === 'light') {
                  theme = 'light';
                } else {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                root.classList.add(theme);
                root.style.colorScheme = theme;
              })()
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-synaply-light text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col min-h-screen relative`} suppressHydrationWarning>
        <div className="fixed inset-0 bg-mesh -z-10" />
        <div className="fixed inset-0 mesh-grid -z-10 opacity-60" />
        <ServiceWorkerRegister />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <I18nProvider>
              <ScoreProvider>
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </ScoreProvider>
            </I18nProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}