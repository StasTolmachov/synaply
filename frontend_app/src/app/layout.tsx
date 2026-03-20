import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ScoreProvider } from "@/components/ScoreContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WordsGo Beta - Learn new words with spaced repetition",
  description: "Learn new words with spaced repetition. The easiest way to expand your vocabulary.",
  keywords: ["learn english", "spaced repetition", "vocabulary", "words", "learning"],
  authors: [{ name: "WordsGo Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WordsGo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "WordsGo Beta",
    description: "Learn new words with spaced repetition",
    url: "https://wordsgo.tolmachov.dev",
    siteName: "WordsGo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "WordsGo AI Language Learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WordsGo Beta",
    description: "Learn new words with spaced repetition",
    creator: "@WordsGoTeam",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "https://wordsgo.tolmachov.dev",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme');
                const root = document.documentElement;
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col min-h-screen`} suppressHydrationWarning={true}>
        <ServiceWorkerRegister />
        <ThemeProvider>
          <ScoreProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </ScoreProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
};