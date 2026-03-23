'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { sendGAEvent } from '@next/third-parties/google';
import { Brain, ArrowLeft, Loader2, Send, CheckCircle2, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/components/I18nContext';

type PracticeState = 'setup' | 'generating' | 'translating' | 'feedback';
  
interface PracticeResult {
  sentence_number: number;
  your_version: string;
  status: 'correct' | 'mistake' | 'skipped';
  status_localized: string;
  teacher_comment: string;
  ideal_translation: string;
}

interface PracticeFeedback {
  general_comment: string;
  results: PracticeResult[];
}

interface StartPracticeResponse {
  level: string;
  sentences: string[];
}

export default function PracticePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<PracticeState>('setup');
  const [topic, setTopic] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [userTranslation, setUserTranslation] = useState('');
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setState('generating');

    try {
      sendGAEvent('event', 'start_practice', { topic: topic });
      const res: StartPracticeResponse = await fetchApi('/practice/startPractice', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      });
      setSentences(res.sentences);
      setLevel(res.level);
      setState('translating');
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setState('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTranslation = async () => {
    if (!userTranslation.trim()) return;
    setLoading(true);
    setError('');

    try {
      sendGAEvent('event', 'submit_translation', { state: state });
      const res = await fetchApi('/practice/checkAnswerPractice', {
        method: 'POST',
        body: JSON.stringify({ translation: userTranslation }),
      });
      setFeedback(res);
      setState('feedback');
    } catch (err: any) {
      setError(err.message || t('dashboard.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setState('translating');
    setFeedback(null);
  };

  const handleFinish = async () => {
    try {
      sendGAEvent('event', 'finish_practice', {});
      await fetchApi('/practice/finishPractice', {
        method: 'POST',
      });
    } catch (err: any) {
      console.error('Failed to finish practice:', err);
    } finally {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>{t('common.back_to_dashboard')}</span>
          </Link>
          <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
            <Brain className="w-6 h-6 mr-2" />
            <span>{t('dashboard.practice_title')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {state === 'setup' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center max-w-2xl mx-auto transition-colors">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.practice_setup_title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              {t('dashboard.practice_setup_desc')}
            </p>
            
            <form onSubmit={handleStart} className="space-y-6 text-left">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('dashboard.practice_title')}
                </label>
                <input
                  type="text"
                  id="topic"
                  placeholder={t('dashboard.topic_placeholder')}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 border px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-purple-500 shadow-sm transition-all"
                  value={topic}
                  maxLength={300}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('dashboard.practice_topic_hint')}
                  </p>
                  <p className={`text-xs ${topic.length >= 300 ? 'text-red-500 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {topic.length}/300
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-6 py-4 border border-transparent text-base font-bold rounded-xl shadow-lg text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 dark:disabled:bg-purple-900/50 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {t('dashboard.start_practice')}
              </button>
            </form>
          </div>
        )}

        {state === 'generating' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">{t('dashboard.generating_sentences')}</h2>
          </div>
        )}

        {(state === 'translating' || state === 'feedback') && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('dashboard.practice_translating_title')}</h3>
                {level && (
                  <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Level: {level}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {sentences.map((sentence, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-gray-400 dark:text-gray-500 font-bold mr-3 mt-1">{idx + 1}.</span>
                    <p className="text-xl leading-relaxed text-gray-800 dark:text-gray-200 font-medium">{sentence}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t('dashboard.your_version')}:</h3>
              <textarea
                className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 border px-4 py-4 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-purple-500 shadow-sm transition-all min-h-[150px] text-lg"
                placeholder={t('dashboard.type_translation')}
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                disabled={state === 'feedback' && loading}
              />

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmitTranslation}
                  disabled={loading || !userTranslation.trim()}
                  className="flex-1 flex justify-center items-center px-6 py-4 border border-transparent text-base font-bold rounded-full shadow-lg shadow-synaply-blue/20 text-white bg-synaply-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-synaply-blue disabled:opacity-50 transition-all"
                >
                  {loading && state === 'translating' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                  {t('dashboard.submit_practice')}
                </button>
                
                <button
                  onClick={handleFinish}
                  className="flex justify-center items-center px-6 py-4 border border-gray-200 dark:border-gray-700 text-base font-semibold rounded-xl text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all shadow-sm"
                >
                  {t('dashboard.practice_finished')}
                </button>
              </div>
            </div>

            {state === 'feedback' && feedback && (
              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-900/30 p-8 animate-in slide-in-from-bottom-4 duration-500 transition-colors">
                <div className="flex items-start mb-6">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg mr-4">
                    <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">{t('dashboard.feedback_title')}</h3>
                    <p className="text-purple-700 dark:text-purple-300">{t('dashboard.teacher_comment')}</p>
                  </div>
                </div>
                
                <div className="prose prose-purple dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 mb-8 pb-6 border-b border-purple-200 dark:border-purple-800 italic">
                  {feedback.general_comment}
                </div>

                <div className="space-y-6">
                  {feedback.results.map((result, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.sentence')} {result.sentence_number}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          result.status === 'correct' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 
                          result.status === 'mistake' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {result.status_localized}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">{t('dashboard.your_version')}</p>
                          <p className="text-gray-900 dark:text-gray-100">{result.your_version}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">{t('dashboard.teacher_comment')}</p>
                          <p className="text-gray-800 dark:text-gray-200">{result.teacher_comment}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">{t('dashboard.ideal_translation')}</p>
                          <p className="text-synaply-blue dark:text-synaply-cyan font-bold">{result.ideal_translation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-purple-200 dark:border-purple-800 flex flex-wrap gap-4">
                  <button
                    onClick={handleTryAgain}
                    className="flex items-center text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-bold transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    {t('dashboard.practice_again')}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
