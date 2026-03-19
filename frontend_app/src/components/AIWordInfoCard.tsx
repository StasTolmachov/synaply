"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, X } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import { fetchApi } from '@/lib/api';
import { useScore } from '@/components/ScoreContext';

interface AIWordInfoCardProps {
  sourceWord: string;
  targetWord: string;
}

export function AIWordInfoCard({ sourceWord, targetWord }: AIWordInfoCardProps) {
  const { langs } = useScore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAIInfo = async () => {
    if (!sourceWord || !targetWord || !langs) return;

    setIsOpen(true);
    setLoading(true);
    setError(null);

    try {
      sendGAEvent('event', 'ai_insight_click', { target_word: targetWord });
      const data = await fetchApi('/words/wordInfo', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: langs.source,
          target_lang: langs.target,
          source_word: sourceWord,
          target_word: targetWord,
        }),
      });

      if (data && data.response) {
        setInfo(data.response);
      } else {
        throw new Error("The AI is taking a quick coffee break. Please try again in a moment!");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Oops! We couldn't get the AI insights. Let's try again!");
    } finally {
      setLoading(false);
    }
  };

  const closeInfo = () => {
    setIsOpen(false);
  };

  return (
    <div className="mt-4 w-full">
      {!isOpen && (
        <button
          type="button"
          onClick={fetchAIInfo}
          disabled={!sourceWord || !targetWord || !langs}
          className="inline-flex items-center px-4 py-2 border border-purple-200 text-sm font-medium rounded-full shadow-sm text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Insights
        </button>
      )}

      {isOpen && (
        <div className="relative bg-purple-50/50 rounded-xl border border-purple-100 p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={closeInfo}
            className="absolute top-4 right-4 text-purple-400 hover:text-purple-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pr-6">
            <h4 className="flex items-center text-sm font-semibold text-purple-900 mb-3">
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              AI Explanation for &quot;{targetWord}&quot;
            </h4>

            {loading ? (
              <div className="flex items-center text-purple-600 text-sm py-2">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI is thinking...
              </div>
            ) : error ? (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </div>
            ) : info ? (
              <div className="prose prose-sm prose-purple max-w-none text-gray-700">
                <ReactMarkdown>{info}</ReactMarkdown>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
