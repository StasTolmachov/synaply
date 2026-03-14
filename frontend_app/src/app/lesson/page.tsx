'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function Lesson() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState<{ id: string; source_word: string; target_word: string; comment?: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; showNextBtn: boolean } | null>(null);
  const [error, setError] = useState('');
  const [lessonFinished, setLessonFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startLesson();
  }, []);

  const startLesson = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchApi('/lesson/start');
      setWord(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes('no words')) {
        setLessonFinished(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to start lesson');
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

    if (!answer.trim() || submitting || feedback?.isCorrect) return;
    setSubmitting(true);
    
    try {
      const data = await fetchApi('/lesson/check', {
        method: 'POST',
        body: JSON.stringify({ id: word?.id, target_word: answer.trim() })
      });

      if (data.is_correct) {
        setFeedback({ isCorrect: true, showNextBtn: false });
        setTimeout(() => {
          if (data.next_word) {
            setWord(data.next_word);
            setAnswer('');
            setFeedback(null);
            inputRef.current?.focus();
          } else {
            setLessonFinished(true);
          }
        }, 1000);
      } else {
        // If incorrect, show the correct word and a next button
        setWord(data.next_word); // The backend returns the same word with correct info
        setFeedback({ isCorrect: false, showNextBtn: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message?.includes('no words') || err.message?.includes('no more words'))) {
        setLessonFinished(true);
      } else {
        setError(err instanceof Error ? err.message : 'Error checking answer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextWord = async () => {
    // If we were incorrect, we need to try again or fetch next. 
    // Wait, the backend returns the current word if incorrect. So user has to type it correctly next time.
    setFeedback(null);
    setAnswer('');
    inputRef.current?.focus();
  };

  const finishLesson = async () => {
    try {
      await fetchApi('/lesson/finish', { method: 'POST' });
    } catch (_e) {}
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (lessonFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Lesson Complete!</h2>
          <p className="text-gray-600">You have no more words to review right now.</p>
          <button
            onClick={finishLesson}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Oops, an error occurred</h2>
          <p className="text-gray-600">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Practice Session</h1>
          <button onClick={finishLesson} className="text-sm font-medium text-gray-500 hover:text-gray-700">
            End Lesson
          </button>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden p-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">{word?.source_word}</h2>
            {word?.comment && (
              <p className="text-sm text-gray-500">{word?.comment}</p>
            )}
          </div>

          <form onSubmit={handleCheck} className="space-y-6">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                disabled={feedback?.isCorrect}
                placeholder="Type the translation..."
                className="block w-full text-center text-lg rounded-xl border-gray-300 border-2 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm disabled:bg-gray-50"
                autoFocus
                autoComplete="off"
              />
            </div>

            {feedback && (
              <div className={`p-4 rounded-xl flex items-center ${feedback.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {feedback.isCorrect ? (
                  <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">{feedback.isCorrect ? 'Correct!' : 'Incorrect.'}</p>
                  {!feedback.isCorrect && (
                    <p className="text-sm mt-1">The correct answer is: <strong>{word?.target_word}</strong></p>
                  )}
                </div>
              </div>
            )}

            {!feedback?.showNextBtn ? (
              <button
                type="submit"
                disabled={submitting || feedback?.isCorrect}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (answer.trim() ? 'Check Answer' : 'Skip')}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextWord}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
