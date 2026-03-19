'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, Brain, List, Search, Star, Languages, XCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-500 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">How to use WordsGo</h1>
        </div>

        <div className="space-y-12">
          {/* Section: Getting Started */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-3 text-yellow-500" />
              Getting Started
            </h2>
            <p className="text-gray-600 mb-4 text-lg">
              WordsGo is a powerful tool designed to help you expand your vocabulary and improve your language skills using spaced repetition and AI-powered practice.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">Step 1: Add Words</h3>
                <p className="text-sm text-blue-800">Start by adding words or phrases you want to learn from your Dashboard.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="font-bold text-purple-900 mb-2">Step 2: Review Daily</h3>
                <p className="text-sm text-purple-800">Use the Vocabulary Review to memorize words using spaced repetition logic.</p>
              </div>
            </div>
          </section>

          {/* Section: Dashboard & Adding Words */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="w-6 h-6 mr-3 text-blue-600" />
              Dashboard & Adding Words
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 mr-4">1</div>
                <div>
                  <h3 className="font-bold text-gray-900">Manual Entry</h3>
                  <p className="text-gray-600 text-sm">Enter the word in your native language and its translation. You can also add comments or usage context for better learning.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 mr-4">2</div>
                <div>
                  <h3 className="font-bold text-gray-900">Auto-translation</h3>
                  <p className="text-gray-600 text-sm">Click the <strong>"Auto-translate empty field"</strong> link to automatically fill the missing translation using our translation service.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 mr-4">3</div>
                <div>
                  <h3 className="font-bold text-gray-900">AI Insights (Gemini)</h3>
                  <p className="text-gray-600 text-sm">After entering a word, an AI-powered card will appear below, providing additional information like synonyms, usage examples, and grammatical tips.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Vocabulary Review */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-green-600" />
              Vocabulary Review (Spaced Repetition)
            </h2>
            <p className="text-gray-600 mb-6 italic">
              WordsGo uses a spaced repetition algorithm (FSRS) to determine exactly when you should review each word for maximum retention.
            </p>
            <div className="space-y-6">
              <div className="border-l-4 border-green-200 pl-4 py-2">
                <h3 className="font-bold text-gray-900">The Review Process</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-2">
                  <li>You will be shown the word in your source language.</li>
                  <li>Type the translation and press <strong>Enter</strong> or click <strong>Check Answer</strong>.</li>
                  <li>If you don't remember, click <strong>"Don't remember"</strong> to see the answer.</li>
                  <li>Review the AI card for the word to reinforce your memory.</li>
                  <li>The algorithm will reschedule the word based on whether you got it right or wrong.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section: AI Practice */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Brain className="w-6 h-6 mr-3 text-purple-600" />
              AI Practice: Sentence Translation
            </h2>
            <p className="text-gray-600 mb-6">
              This feature goes beyond just words. It helps you practice grammar and context by translating whole sentences.
            </p>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">How it works:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                  <li>Choose a <strong>topic</strong> (e.g., "Business", "Travel") or leave it blank to use your own word list.</li>
                  <li>AI generates several sentences for you to translate.</li>
                  <li>Submit your translation for detailed feedback.</li>
                  <li>The AI acts as a teacher, highlighting your mistakes and providing an <strong>ideal translation</strong> with explanations.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section: Managing Your Words */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <List className="w-6 h-6 mr-3 text-blue-500" />
              Managing Your Words
            </h2>
            <div className="space-y-4 text-gray-600 text-sm">
              <p className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                <strong>Search:</strong> Use the search bar to find specific words in your collection.
              </p>
              <p className="flex items-center">
                <Languages className="w-4 h-4 mr-2" />
                <strong>Editing:</strong> Click the "Edit" button to change the original word, translation, or comment.
              </p>
              <p className="flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                <strong>Deleting:</strong> Remove words you no longer wish to study.
              </p>
            </div>
          </section>

          {/* Section: Scoring System */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-3 text-blue-600" />
              Score & Progress
            </h2>
            <p className="text-gray-600 text-sm">
              Your score (visible in the top header) represents your total number of correctly answered words during review sessions. Keep track of your progress as your vocabulary grows!
            </p>
          </section>

          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-400 text-sm">WordsGo - Your AI-Powered Language Learning Assistant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
