'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { Brain, Zap, Infinity, Bot, ArrowRight, CheckCircle, Sparkles, MessageSquare, Languages, Database, BarChart3, Target, Globe } from 'lucide-react';
import { useTranslation } from '@/components/I18nContext';

export default function LandingPage() {
  const router = useRouter();
  const { t, setLang, resetToSaved } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const flags = [
    '🇺🇸', '🇬🇧', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇵🇹', '🇳🇱', '🇵🇱', '🇷🇺', '🇯🇵', '🇰🇷', '🇨🇳', '🇹🇷', '🇮🇩', '🇺🇦', '🇬🇷', '🇨🇿',
    '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇭🇺', '🇷🇴', '🇧🇬', '🇸🇰', '🇭🇷', '🇷🇸', '🇮🇪', '🇦🇹', '🇨🇭', '🇧🇪', '🇲🇽', '🇨🇦', '🇦🇺', '🇳🇿',
    '🇧🇷', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇿🇦', '🇪🇬', '🇸🇦', '🇦🇪', '🇮🇱', '🇮🇳', '🇵🇰', '🇧🇩', '🇻🇳', '🇹🇭', '🇲🇾', '🇵🇭', '🇸🇬',
    '🇭🇰', '🇹🇼', '🇰🇿', '🇺🇿', '🇦🇿', '🇬🇪', '🇦🇲', '🇱🇹', '🇱🇻', '🇪🇪', '🇮🇸', '🇱🇺', '🇲🇨', '🇨🇾', '🇲🇹', '🇻🇦', '🇦🇱', '🇲🇪',
    '🇽🇰', '🇲🇰', '🇧🇦', '🇲🇩', '🇰🇬', '🇹🇯', '🇹🇲', '🇲🇳', '🇳🇵', '🇱🇰', '🇲🇲', '🇰🇭', '🇱🇦', '🇰🇵', '🇲🇦', '🇩🇿', '🇹🇳', '🇱🇧',
    '🇯🇴', '🇮🇶', '🇰🇼', '🇶🇦', '🇴🇲', '🇾🇪', '🇳🇬', '🇬🇭', '🇰🇪', '🇪🇹', '🇹🇿', '🇺🇬', '🇷🇼', '🇨🇲', '🇨🇮', '🇸🇳', '🇦🇴', '🇲🇿',
    '🇨🇺', '🇯🇲', '🇵🇷', '🇩🇴', '🇨🇷', '🇵🇦'
  ]; // Approximately 114 flags (18 + 96 = 114)

  useEffect(() => {
    // Check login state
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsLoggedIn(true);
    }
    
    return () => {
      // Restore saved language when leaving landing page
      if (typeof window !== 'undefined' && resetToSaved) {
        resetToSaved();
      }
    };
  }, [resetToSaved]); // Only on mount/unmount

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'WordsGo',
    alternateName: 'WordsGo Language Learning',
    description: 'Learn new words with AI-powered spaced repetition. The easiest way to expand your vocabulary.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: 'https://synaply.me',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'WordsGo Team',
      logo: 'https://synaply.me/apple-icon.png'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1540',
    },
    featureList: [
      'Spaced Repetition System',
      'AI-powered translations',
      'Public word lists',
      'Progress tracking'
    ]
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style jsx global>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-3deg); }
          75% { transform: translateY(3px) rotate(3deg); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          display: inline-block;
          animation: wave 3s ease-in-out infinite;
        }
        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        .mask-fade {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .prose-article {
          max-width: 90ch;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.85;
          color: #374151;
          font-size: 1.15rem;
        }
        .prose-article h2 {
          color: #111827;
          font-weight: 800;
          font-size: 3.5rem;
          margin-top: 6rem;
          margin-bottom: 3rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          text-align: center;
          background: linear-gradient(to bottom right, #111827, #2563eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .prose-article h3 {
          color: #111827;
          font-weight: 700;
          font-size: 2.25rem;
          margin-top: 5rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          letter-spacing: -0.02em;
        }
        .prose-article h3::before {
          content: "";
          display: inline-block;
          width: 0.6rem;
          height: 2.25rem;
          background: linear-gradient(to bottom, #2563eb, #60a5fa);
          border-radius: 9999px;
        }
        .prose-article h4 {
          color: #1f2937;
          font-weight: 700;
          font-size: 1.5rem;
          margin-top: 3rem;
          margin-bottom: 1rem;
        }
        .prose-article p {
          margin-top: 1.75rem;
          margin-bottom: 1.75rem;
        }
        .prose-article ul, .prose-article ol {
          margin-top: 2rem;
          margin-bottom: 2rem;
          padding-left: 2.5rem;
        }
        .prose-article li {
          margin-top: 1rem;
          margin-bottom: 1rem;
          position: relative;
        }
        .prose-article blockquote {
          border-left: 4px solid #2563eb;
          padding-left: 2rem;
          font-style: italic;
          color: #4b5563;
          margin: 3rem 0;
          font-size: 1.25rem;
        }
        .article-card {
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border-radius: 2rem;
          padding: 3.5rem;
          margin: 4.5rem 0;
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
        }
        .article-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, #2563eb, #60a5fa, #2563eb);
        }
        .article-card::after {
          content: "";
          position: absolute;
          top: -50px;
          right: -50px;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        .comparison-table-wrapper {
          overflow-x: auto;
          margin: 3rem 0;
          border-radius: 1.5rem;
          border: 1px solid #e2e8f0;
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .comparison-table th {
          background: #f8fafc;
          padding: 1.5rem;
          font-weight: 700;
          color: #111827;
          border-bottom: 1px solid #e2e8f0;
        }
        .comparison-table td {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .comparison-table tr:last-child td {
          border-bottom: none;
        }
        .faq-item {
          border-bottom: 1px solid #f1f5f9;
          padding: 2rem 0;
        }
        .faq-item:last-child {
          border-bottom: none;
        }
        .faq-question {
          font-weight: 700;
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 1rem;
          display: flex;
          gap: 1rem;
        }
        .faq-answer {
          color: #4b5563;
        }
      `}</style>
      
      <header>
        {/* Header/Nav */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <Brain className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-blue-600">WordsGo</span>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href="/public-lists"
                  className="text-gray-600 hover:text-blue-600 font-medium px-2 transition-colors flex items-center gap-1"
                >
                  <Globe className="w-4 h-4 text-green-500" />
                  {t('landing.public_lists')}
                </Link>
                {isLoggedIn ? (
                  <Link 
                    href="/dashboard"
                    className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-2 transition-colors">Sign in</Link>
                    <Link 
                      href="/register"
                      className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 animate-fade-in border border-blue-100">
            Next-Gen Language Learning
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent pb-2">
            Your Personal Path <br />
            to Language Fluency
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop guessing and start remembering. WordsGo uses advanced cognitive science 
            to ensure you never forget a word again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
            >
              {t('landing.try_for_free')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/public-lists"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 hover:border-blue-200 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5 text-blue-500" />
              {t('landing.browse_lists')}
            </Link>
          </div>
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20"></div>
            <img 
              src="/opengraph-image.png" 
              alt="WordsGo App Interface - AI-powered vocabulary learning dashboard" 
              className="relative rounded-2xl shadow-2xl border border-gray-100 w-full"
            />
          </div>
        </div>
      </section>

      {/* Stats/Quick Features */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">FSRS</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Memory Algorithm</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">AI</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Gemini Integration</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">114</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold text-center relative overflow-hidden">
              Languages
              <div className="mt-2 overflow-hidden flex whitespace-nowrap mask-fade">
                <div className="animate-scroll flex gap-2">
                  {[...flags, ...flags].map((flag, i) => (
                    <span 
                      key={i} 
                      className="animate-wave text-xl" 
                      style={{ animationDelay: `${(i % flags.length) * 0.1}s` }}
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">DeepL</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Accurate Translation</div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">Built for Long-Term Memory</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-xl">
              Standard flashcards are boring. Our system adapts to your unique learning pace 
              using data-driven insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-8">
                <Brain className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Advanced FSRS+</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                We utilize the <strong>FSRS</strong> (Free Spaced Repetition Scheduler), 
                extensively <strong>enhanced with our proprietary optimization algorithms</strong> to predict your memory decay with unprecedented accuracy.
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                <Target className="w-4 h-4" />
                Scientifically proven memory optimization
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                <Infinity className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Public Word Lists</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Don&apos;t know where to start? Explore and import themed word lists created by our community. 
                From TOEFL prep to "Travel Essentials" — find what you need.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                <Database className="w-4 h-4" />
                Ready-to-use vocabulary for any goal
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-8">
                <Sparkles className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Gemini AI Tutor</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Practice in context. Gemini AI generates personalized examples and exercises using the specific words you are currently learning.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span><strong>Smart Examples:</strong> Sentences tailored to your level.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span><strong>Interactive Practice:</strong> Real-time feedback on your usage.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Detailed Section */}
      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold mb-6">
                <Bot className="w-4 h-4" />
                Next-Gen AI Companion
              </div>
              <h2 className="text-4xl font-bold mb-8 leading-tight">Beyond Simple Translation</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Infinite Context</h4>
                    <p className="text-gray-600">Don&apos;t just learn words, learn how to use them. Gemini AI generates real-world examples specifically for your vocabulary.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Smart Public Lists</h4>
                    <p className="text-gray-600">Join thousands of users sharing their curated word lists. From academic vocabulary to niche professional terms.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Languages className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">DeepL Precision</h4>
                    <p className="text-gray-600">We use the world&apos;s best translation algorithms to ensure you learn only correct and natural language options.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3rem] p-1 shadow-2xl overflow-hidden">
                <img 
                  src="/promo-ai-brain-1-1.png" 
                  alt="WordsGo AI Brain" 
                  className="w-full h-full object-cover rounded-[2.8rem]"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400/20 blur-3xl rounded-full"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-400/20 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How does it work?</h2>
            <p className="text-gray-600 text-lg">3 simple steps to language fluency</p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: "1",
                title: "Add or Translate Words",
                description: "Met an unfamiliar word in a book or movie? Just type it in. The system will instantly translate it via DeepL and add it to your personal dictionary."
              },
              {
                step: "2",
                title: "Launch a Smart Lesson",
                description: "Our algorithm will select exactly those words that your memory is about to forget. Study on the subway, in line, or at home — the lesson lasts as long as you have time."
              },
              {
                step: "3",
                title: "Practice with an AI Tutor",
                description: "Test your knowledge in a real-world context. The AI will compose sentences using your words and help correct mistakes in real-time."
              },
              {
                step: "4",
                title: "Track Your Progress",
                description: "Every correct answer increases your rating and memory stability. Watch as words move from \"new\" status to the \"learned forever\" category."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-8 items-start group">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Article Section */}
      <section className="py-32 px-4 bg-white border-t border-gray-100">
        <article className="prose-article">
          <div className="mb-20 text-center">
            <h2 className="!mt-0">The Science of Fluency: Master Any Language with WordsGo</h2>
            <p className="text-2xl text-gray-500 max-w-3xl mx-auto">
              A deep dive into the technology, psychology, and methodology powering the world&apos;s most efficient language learning platform.
            </p>
          </div>

          <p>
            In today&apos;s interconnected world, mastering a new language is more than just a hobby—it&apos;s a gateway to new cultures, professional opportunities, and personal growth. However, the biggest challenge for most learners isn&apos;t starting; it&apos;s <strong>retention</strong>. Traditional methods often lead to the &quot;forgetting curve,&quot; where new vocabulary vanishes as quickly as it was acquired. WordsGo was built to solve this problem by combining cutting-edge cognitive science with state-of-the-art Artificial Intelligence.
          </p>

          <div className="article-card">
            <h3>The Science of Memory: Our Advanced FSRS+ Algorithm</h3>
            <p>
              At the heart of WordsGo lies the <strong>Free Spaced Repetition Scheduler (FSRS)</strong>. Unlike the older SM-2 algorithms used by many popular apps, FSRS is a modern, data-driven model designed to predict the stability of your memory with incredible precision.
            </p>
            <p>
              Our proprietary <strong>FSRS+ enhancement</strong> takes this a step further. It analyzes your unique learning patterns—how quickly you recall a word, how often you struggle with specific types of vocabulary, and your individual forgetting rate. By calculating the exact moment before a word slips from your mind, WordsGo schedules reviews at the <strong>optimal interval</strong>, ensuring maximum retention with minimum effort.
            </p>
            
            <div className="mt-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
              <h4 className="!mt-0">FSRS vs. Traditional SM-2</h4>
              <p className="text-sm">
                While SM-2 uses fixed multipliers (the &quot;ease factor&quot;), FSRS implements a <strong>Stochastic Shortest Path</strong> algorithm to optimize for long-term retention. Studies show that FSRS can reduce study time by up to 30% while achieving the same target retention levels compared to traditional spaced repetition models.
              </p>
            </div>
          </div>

          <h3>Why We Forget: Combatting the Forgetting Curve</h3>
          <p>
            The &quot;Forgetting Curve,&quot; first proposed by Hermann Ebbinghaus, illustrates how information is lost over time when there is no attempt to retain it. Without reinforcement, humans forget approximately 50% of new information within 24 hours. WordsGo is engineered specifically to disrupt this curve.
          </p>
          
          <blockquote>
            &quot;The secret to permanent memory isn&apos;t repetition; it&apos;s <strong>timed retrieval</strong>. By forcing the brain to recall information just as it is about to be lost, we strengthen the synaptic connections permanently.&quot;
          </blockquote>

          <p>
            By utilizing the <strong>FSRS algorithm</strong>, we don&apos;t just remind you of words randomly. We present them at the precise point of &quot;desirable difficulty&quot;—the moment when your brain has to work just hard enough to recall the information, which significantly strengthens the neural pathways associated with that memory. This makes your study sessions 300% more efficient than traditional rote memorization.
          </p>

          <h3>The Technology Stack: AI-Powered Context</h3>
          <p>
            Learning a word in isolation is rarely effective. To truly &quot;own&quot; a word, you must understand its nuances and see it in action. This is where our AI integration becomes your most powerful ally:
          </p>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong>DeepL Precision:</strong> For every word you add, we utilize DeepL—widely recognized as the world&apos;s most accurate translation engine. This ensures that the definitions and synonyms you learn are natural and contextually correct.
            </li>
            <li>
              <strong>Gemini AI Tutor:</strong> WordsGo leverages Google&apos;s Gemini AI to generate personalized usage examples. If you&apos;re learning the word &quot;sustainable&quot; in a business context, Gemini won&apos;t just give you a generic sentence; it will craft examples relevant to your specific field of interest.
            </li>
            <li>
              <strong>Interactive Feedback:</strong> During AI Practice sessions, Gemini acts as a live tutor. It doesn&apos;t just tell you if you&apos;re wrong; it explains <em>why</em> and suggests more idiomatic ways to express your thoughts.
            </li>
          </ul>

          <div className="article-card bg-blue-50/30 border-blue-100">
            <h3>Comparison: WordsGo vs. The Old Way</h3>
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Traditional Apps</th>
                    <th>WordsGo (AI + FSRS)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Algorithm</strong></td>
                    <td>SM-2 (1980s Tech)</td>
                    <td>FSRS v4.5 (Modern AI)</td>
                  </tr>
                  <tr>
                    <td><strong>Context</strong></td>
                    <td>Generic sentences</td>
                    <td>AI-Generated personalized context</td>
                  </tr>
                  <tr>
                    <td><strong>Translations</strong></td>
                    <td>Community-vetted (Slow)</td>
                    <td>DeepL + Gemini (Instant/Pro)</td>
                  </tr>
                  <tr>
                    <td><strong>Adaptability</strong></td>
                    <td>Linear progression</td>
                    <td>Dynamic cognitive modeling</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3>Advanced Cognitive Load Management</h3>
          <p>
            One of the primary reasons learners quit is &quot;overwhelm.&quot; When you have too many words to review, the task becomes daunting. WordsGo implements <strong>Cognitive Load Balancing</strong>. Our AI monitors your performance and, if it detects fatigue or a drop in accuracy, it automatically throttles the introduction of new words while prioritizing the most critical reviews.
          </p>
          <p>
            This ensures that you remain in the <strong>&quot;Flow State&quot;</strong>—a psychological state where you are fully immersed in the activity, feeling energized and focused. Learning becomes addictive rather than exhaustive.
          </p>

          <h3>Core Features for Global Learners</h3>
          <p>
            WordsGo is more than just a flashcard app; it&apos;s a comprehensive language-learning laboratory. Our features are designed to support every stage of your journey:
          </p>
          <ul className="list-disc pl-6 space-y-4">
            <li><strong>114 Languages Supported:</strong> From Spanish and French to more niche languages like Icelandic or Vietnamese, our platform provides robust support for a global community of learners.</li>
            <li><strong>Public Word Lists:</strong> Don&apos;t waste time building dictionaries from scratch. Explore thousands of curated lists created by experts and fellow learners.</li>
            <li><strong>Smart Playlists:</strong> Group multiple word lists into cohesive &quot;playlists&quot; to manage complex learning goals effortlessly.</li>
            <li><strong>Progress Analytics:</strong> Track your growth with detailed statistics. Watch your &quot;Memory Rating&quot; climb as you move words from short-term struggle to long-term mastery.</li>
          </ul>

          <h3>The Social Learning Revolution</h3>
          <p>
            Language learning shouldn&apos;t be a solitary endeavor. WordsGo fosters a vibrant community where users share their knowledge through <strong>Public Word Lists</strong>. This crowdsourced approach means you have access to specialized vocabulary that you won&apos;t find in any textbook—from regional slang to highly technical engineering terms.
          </p>

          <div className="article-card bg-emerald-50/30 border-emerald-100">
            <h3>Real-World Use Cases: How WordsGo Changes Lives</h3>
            <div className="space-y-12">
              <div>
                <h4 className="text-blue-600">The Professional Track</h4>
                <p className="italic">&quot;I needed to learn technical German for my new job in engineering. Standard apps were too generic. With WordsGo, I created a custom list of engineering terms, and the AI helped me use them in professional emails. I felt confident in my first meeting!&quot;</p>
                <p className="font-bold">— Mark S., Mechanical Engineer</p>
              </div>
              <div className="pt-6 border-t border-emerald-100">
                <h4 className="text-blue-600">The Academic Path</h4>
                <p className="italic">&quot;Preparing for the SAT vocabulary section was a nightmare until I found the public lists on WordsGo. The FSRS algorithm made sure I didn&apos;t forget the words I learned in week one by the time the exam came around.&quot;</p>
                <p className="font-bold">— Sarah L., High School Student</p>
              </div>
            </div>
          </div>

          <h3>Frequently Asked Questions (FAQ)</h3>
          <div className="space-y-4">
            <div className="faq-item">
              <div className="faq-question">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <span>How is FSRS better than Anki?</span>
              </div>
              <div className="faq-answer">
                While Anki is powerful, its default algorithm is based on SM-2. WordsGo uses FSRS, which is mathematically proven to be more efficient. Furthermore, WordsGo integrates AI (Gemini/DeepL) directly into the workflow, whereas Anki requires manual deck creation.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <span>Can I use WordsGo offline?</span>
              </div>
              <div className="faq-answer">
                Yes! Our Progressive Web App (PWA) technology allows you to continue your reviews even without an active internet connection. Your progress will sync automatically once you&apos;re back online.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <span>Is it free to use?</span>
              </div>
              <div className="faq-answer">
                WordsGo offers a generous free tier that includes access to all core FSRS features and a limited number of AI-powered translations and practices per day.
              </div>
            </div>
          </div>

        </article>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to hack your memory?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join WordsGo and try the most scientifically proven system for learning foreign words.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="px-10 py-5 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-900/40"
            >
              Create free account
            </Link>
            {!isLoggedIn && (
              <Link 
                href="/login"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all"
              >
                Already have an account? Sign in
              </Link>
            )}
          </div>
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 grayscale opacity-50">
             <div className="text-xl font-bold tracking-tighter">AI-POWERED</div>
             <div className="text-xl font-bold tracking-tighter">ENHANCED FSRS+</div>
             <div className="text-xl font-bold tracking-tighter">DEEPL-READY</div>
             <div className="text-xl font-bold tracking-tighter">114 LANGUAGES</div>
          </div>
        </div>
      </section>
    </main>
    </div>
  );
}