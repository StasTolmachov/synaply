'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Zap, Infinity, Bot, ArrowRight, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
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
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 animate-fade-in">
            Next-Gen Language Learning
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Learn words the way <br />
            your brain works
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            An intelligent language learning system that adapts to your memory. 
            Personalized AI-powered practice for words you actually use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
            >
              Start learning for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Key Question */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why does it work better than regular flashcards?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              We don&apos;t force you to repeat the same things in endless loops. 
              Our system analyzes your every move and builds the perfect learning trajectory.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Your personal memory algorithm</h3>
              <p className="text-gray-600 leading-relaxed">
                Forget about random lessons. We use the advanced mathematical algorithm of spaced repetition (FSRS). 
                The system calculates the difficulty level of each word and the stability of your memory.
              </p>
              <p className="text-gray-600 mt-4 italic text-sm">
                Study less, but remember forever.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Infinity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Learn at your own pace. Endlessly.</h3>
              <p className="text-gray-600 leading-relaxed">
                Our smart lesson generation algorithm creates the perfect balance: 30% completely new words and 70% words needing review.
              </p>
              <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                Want to study for 5 minutes or 2 hours? Our &quot;endless lesson&quot; system smoothly mixes in words, 
                dynamically updating their weights in real-time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI Practice with Gemini</h3>
              <p className="text-gray-600 leading-relaxed">
                Take your learning beyond flashcards. Practice translating sentences based on your vocabulary. 
                Our AI tutor creates tasks that match your current level and chosen topics.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Contextual practice:</strong> Sentences generated using words you've already learned.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Instant Feedback:</strong> Real-time corrections and explanations from a patient AI teacher.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Artificial intelligence in every word</h3>
              <p className="text-gray-600 leading-relaxed">
                A simple dry translation isn&apos;t enough for fluent communication. 
                Our app is integrated with advanced neural networks.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Perfect translation:</strong> Deep machine learning for accurate native options.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Smart context (AI):</strong> Instant grammar references and usage examples.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How does it work?</h2>
            <p className="text-gray-600">3 simple steps to fluency</p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: "1",
                title: "Add or translate words in one click",
                description: "Met an unfamiliar word in a book, movie, or article? Just type it in. The system will instantly translate it into your language and add it to your personal dictionary."
              },
              {
                step: "2",
                title: "Launch an endless smart lesson",
                description: "Our algorithm will instantly pull from the database exactly the words your memory needs right now. Study on the subway, in line, or at home — the lesson lasts exactly as long as you have time for."
              },
              {
                step: "3",
                title: "Practice with your own AI Tutor",
                description: "Challenge yourself with custom translation exercises. Our AI uses your vocabulary to build sentences that test your knowledge in real-world contexts."
              },
              {
                step: "4",
                title: "Track your progress",
                description: "Every correct answer and successful practice session boosts your rating. Watch as words move from the \"new\" status to \"learned forever\"."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to hack your memory?</h2>
          <p className="text-xl text-gray-400 mb-12">
            Join us and try the most scientifically proven system for learning foreign words.
          </p>
          <Link 
            href={isLoggedIn ? "/dashboard" : "/register"}
            className="inline-flex px-10 py-5 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all"
          >
            Create an account and start
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-2">
          <p>© {new Date().getFullYear()} WordsGo. All rights reserved.</p>
          <p className="text-gray-400">
            Crafted with passion by <a href="https://www.tolmachov.dev" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors font-medium">Tolmachov.dev</a>
            <span className="mx-2">•</span>
            Feedback: <a href="mailto:wordsgo@tolmachov.dev" className="hover:text-blue-600 transition-colors">wordsgo@tolmachov.dev</a>
          </p>
        </div>
      </footer>
    </div>
  );
}