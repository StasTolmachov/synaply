'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { sendGAEvent } from '@next/third-parties/google';
import { Loader2, ArrowRight, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { useScore } from '@/components/ScoreContext';
import { AIWordInfoCard } from '@/components/AIWordInfoCard';
import { useTranslation } from '@/components/I18nContext';

export default function Lesson() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateScore } = useScore();
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState<{ id: string; source_word: string; target_word: string; comment?: string; source_lang?: string; target_lang?: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; showNextBtn: boolean } | null>(null);
  const [error, setError] = useState('');
  const [lessonFinished, setLessonFinished] = useState(false);
  const [nextWordData, setNextWordData] = useState<{ id: string; source_word: string; target_word: string; comment?: string; source_lang?: string; target_lang?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startLesson();
  }, []);

  const startLesson = async () => {
    setLoading(true);
    setError('');
    try {
      sendGAEvent('event', 'lesson_start', {});
      const data = await fetchApi('/lesson/start');
      if (data) {
        const wordData = data.word || data.Word;
        setWord(wordData);
        if (typeof data.total_correct === 'number') {
          updateScore(data.total_correct);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message === 'no_words_for_lesson' || err.message === 'No words found for lesson')) {
        setLessonFinished(true);
      } else {
        setError(err instanceof Error ? err.message : t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we already have feedback and showNextBtn is true, 'Enter' should trigger nextWord
    if (feedback?.showNextBtn) {
      nextWord();
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    
    try {
      sendGAEvent('event', 'lesson_check', { word_id: word?.id });
      const data = await fetchApi('/lesson/check', {
        method: 'POST',
        body: JSON.stringify({ id: word?.id, target_word: answer.trim() })
      });

      if (typeof data.total_correct === 'number') {
        updateScore(data.total_correct);
      }

      setFeedback({ isCorrect: data.is_correct, showNextBtn: true });

      if (word?.target_word) {
        speak(word.target_word, word.target_lang);
      }

      if (data.is_correct) {
        setNextWordData(data.next_word);
      } else {
        if (data.next_word && data.next_word.id !== word?.id) {
          // If the backend returned a DIFFERENT word on failure, store it as next
          setNextWordData(data.next_word);
        } else {
          setNextWordData(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('dashboard.error_occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const nextWord = async () => {
    if (nextWordData) {
      setWord(nextWordData);
      setNextWordData(null);
    } else if (feedback?.isCorrect) {
      setLessonFinished(true);
    }
    
    setFeedback(null);
    setAnswer('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finishLesson = async () => {
    try {
      sendGAEvent('event', 'lesson_finish', {});
      await fetchApi('/lesson/finish', { method: 'POST' });
    } catch (_e) {}
    router.push('/dashboard');
  };

  const speak = (text: string, lang?: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang) {
      utterance.lang = lang;
    }
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  if (lessonFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          {word ? (
            <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.lesson_complete')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {word ? t('dashboard.lesson_complete_desc') : t('dashboard.no_words_for_lesson')}
          </p>
          <button
            onClick={finishLesson}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {t('common.back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.error_occurred')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{t('dashboard.lesson_title')}</h1>
          <button onClick={finishLesson} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {t('dashboard.finish_lesson')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden p-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{word?.source_word}</h2>
            </div>
            {word?.comment && feedback && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{word?.comment}</p>
            )}
          </div>

          <form onSubmit={handleCheck} className="space-y-6">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onPaste={e => e.preventDefault()}
                onDrop={e => e.preventDefault()}
                readOnly={!!feedback}
                placeholder={t('dashboard.type_translation')}
                className="block w-full text-center text-lg rounded-xl border-gray-300 dark:border-gray-700 border-2 px-4 py-3 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 shadow-sm read-only:bg-gray-50 dark:read-only:bg-gray-800/50"
                autoFocus
                autoComplete="off"
              />
            </div>

            {feedback && (
              <div className={`p-4 rounded-xl flex items-center ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                {feedback.isCorrect ? (
                  <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{feedback.isCorrect ? t('dashboard.correct') : t('dashboard.incorrect')}</p>
                  <p className="text-sm mt-1 flex items-center gap-2 flex-wrap">
                    <span className="opacity-70">{t('dashboard.the_answer_was', { answer: '' })}</span>
                    <span className="text-lg font-bold underline decoration-2 underline-offset-4 tracking-wide">
                      {feedback.isCorrect ? answer : word?.target_word}
                    </span>
                    <button
                      type="button"
                      onClick={() => word?.target_word && speak(word.target_word, word.target_lang)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title={t('dashboard.listen')}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </p>
                </div>
              </div>
            )}

            {!feedback?.showNextBtn ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-900 transition-colors"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (answer.trim() ? t('dashboard.check_answer') : t('dashboard.dont_remember'))}
              </button>
            ) : (
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-500 transition-colors"
              >
                {t('dashboard.continue')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </form>

          {feedback && word?.source_word && word?.target_word && (
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-center">
              <AIWordInfoCard key={word.id} sourceWord={word.source_word} targetWord={word.target_word} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
