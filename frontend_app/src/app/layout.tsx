import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ScoreProvider } from "@/components/ScoreContext";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

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
  openGraph: {
    title: "WordsGo Beta",
    description: "Learn new words with spaced repetition",
    url: "https://wordsgo.ru",
    siteName: "WordsGo",
    locale: "en_US",
    type: "website",
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
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`} suppressHydrationWarning={true}>
        <ScoreProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ScoreProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
};