'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, Plus, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [addingWord, setAddingWord] = useState(false);
  const [userLangs, setUserLangs] = useState({ source: '', target: '' });
  
  const [newWord, setNewWord] = useState({ source_word: '', target_word: '', comment: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchApi('/words/GetMe')
      .then(data => {
        if (data?.LangCodeResp) {
          setUserLangs(data.LangCodeResp);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load langs, user might be unauthenticated', err);
        router.push('/login');
      });
  }, [router]);

  const handleTranslate = async () => {
    if (!newWord.source_word && !newWord.target_word) return;
    try {
      setMessage({ type: '', text: '' });
      const res = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          source_word: newWord.source_word,
          target_word: newWord.target_word
        })
      });
      if (res.source_word) setNewWord(prev => ({ ...prev, source_word: res.source_word }));
      if (res.target_word) setNewWord(prev => ({ ...prev, target_word: res.target_word }));
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Translation failed' });
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingWord(true);
    setMessage({ type: '', text: '' });

    try {
      await fetchApi('/words/create', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          source_word: newWord.source_word,
          target_word: newWord.target_word,
          comment: newWord.comment
        })
      });
      setMessage({ type: 'success', text: 'Word added successfully!' });
      setNewWord({ source_word: '', target_word: '', comment: '' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add word' });
    } finally {
      setAddingWord(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Learning {userLangs.target} from {userLangs.source}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to practice?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Start a new spaced-repetition lesson to review your vocabulary.
              </p>
              <Link 
                href="/lesson"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Lesson
              </Link>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-500" />
                  Add New Word
                </h3>
              </div>
              
              <form onSubmit={handleAddWord} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Word in {userLangs.source}
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g. Hello"
                      value={newWord.source_word}
                      onChange={e => setNewWord({...newWord, source_word: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Translation in {userLangs.target}
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g. Hola"
                      value={newWord.target_word}
                      onChange={e => setNewWord({...newWord, target_word: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleTranslate}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Auto-translate missing field
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment / Context (optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Usage example or notes"
                    value={newWord.comment}
                    onChange={e => setNewWord({...newWord, comment: e.target.value})}
                  />
                </div>

                {message.text && (
                  <div className={`text-sm p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={addingWord || (!newWord.source_word && !newWord.target_word)}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400 transition-colors"
                  >
                    {addingWord ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Word
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}