'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Zap, Infinity, Bot, ArrowRight, CheckCircle, Sparkles, MessageSquare, Languages, Database, BarChart3, Target } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
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
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
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
      `}</style>
      {/* Header/Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-blue-600">WordsGo</span>
            </div>
            <div className="flex items-center gap-4">
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
              Try for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20"></div>
            <img 
              src="/opengraph-image.png" 
              alt="WordsGo App Interface" 
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
    </div>
  );
}