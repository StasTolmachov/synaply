'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, Brain, List, Search, Star, Languages, XCircle, Sparkles, GraduationCap, Layers, Lightbulb } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">How to use WordsGo</h1>
        </div>

        <div className="space-y-12">
          {/* Section: Best Practice */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Lightbulb className="w-6 h-6 mr-3 text-yellow-300" />
              Best Practice for Success
            </h2>
            <div className="space-y-4 text-blue-50">
              <p className="text-lg leading-relaxed">
                For the most effective learning experience, we recommend this simple 3-step strategy:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold mb-2">01</div>
                  <p className="text-sm">Add about <strong>100 words</strong> focusing on a <strong>single topic</strong> (e.g., Travel or Business) to create context.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold mb-2">02</div>
                  <p className="text-sm">Master these words through <strong>daily reviews</strong> until they feel familiar and natural.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold mb-2">03</div>
                  <p className="text-sm">Switch to <strong>AI Practice</strong> to use your new vocabulary in full sentences and real-world contexts.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Getting Started */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-3 text-yellow-500" />
              Getting Started
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              WordsGo is a powerful tool designed to help you expand your vocabulary and improve your language skills using spaced repetition and artificial intelligence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Step 1: Add Words</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">Add words manually or use AI to generate lists by topics and levels.</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2">Step 2: Daily Practice</h3>
                <p className="text-sm text-purple-800 dark:text-purple-400">Use Vocabulary Review to memorize words using the FSRS algorithm.</p>
              </div>
            </div>
          </section>

          {/* Section: Adding Words */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Plus className="w-6 h-6 mr-3 text-blue-600" />
              Adding Words
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">1</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Manual Entry</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Enter the word in the language you are learning and its translation. You can add a comment or context for better memorization.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">2</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Auto-translate</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Use the <strong>"Auto-translate"</strong> feature for instant translation via the DeepL service.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">3</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">List Generation (AI Word List)</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Choose a level (A1-C2) and a topic, and AI (Gemini) will compile a list of relevant words for you, which can be added to your dictionary with one click.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">4</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">AI Insights</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">For each word, AI can provide synonyms, usage examples, and grammatical tips.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Vocabulary Review */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-green-600" />
              Spaced Repetition
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
              WordsGo uses the FSRS (Free Spaced Repetition Scheduler) algorithm to calculate the ideal time to repeat each word.
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-green-200 dark:border-green-900 pl-4 py-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Review Process</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-2">
                  <li>You are shown a word in the source language.</li>
                  <li>Enter the translation and press <strong>Enter</strong> or <strong>Check Answer</strong>.</li>
                  <li>If you don't remember — click <strong>"Don't remember"</strong> to see the answer.</li>
                  <li>The algorithm will recalculate the next review date based on your response.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section: AI Practice */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-3 text-purple-600" />
              AI Practice: Sentence Translation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This feature helps train grammar and context by translating entire sentences composed by AI specifically for you.
            </p>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">How it works:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>Select a <strong>topic</strong> (e.g., "Business", "Travel") or leave the field blank.</li>
                  <li>AI will generate 5 sentences on the selected topic.</li>
                  <li>Submit your translation and receive a detailed breakdown.</li>
                  <li>AI will point out mistakes and suggest the <strong>ideal translation</strong> with explanations.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section: Managing Words */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <List className="w-6 h-6 mr-3 text-blue-500" />
              Dictionary Management
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
              <p className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                <strong>Search:</strong> Use the search bar to quickly find words in your collection.
              </p>
              <p className="flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                <strong>Sorting:</strong> View a list of all your words with the option to delete them.
              </p>
              <p className="flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                <strong>Delete all words:</strong> Ability to completely clear your dictionary in one click.
              </p>
            </div>
          </section>

          {/* Section: Progress */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <GraduationCap className="w-6 h-6 mr-3 text-blue-600" />
              Progress and Points
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your score (in the app header) displays the number of correctly translated words. The higher the score, the more words you have successfully mastered!
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
