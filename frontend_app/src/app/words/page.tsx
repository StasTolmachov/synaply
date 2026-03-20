'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Loader2, Search, Trash2, Save, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Word {
  id: string;
  source_word: string;
  target_word: string;
  comment: string;
}

export default function WordsList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Word>>({});

  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const offset = page * limit;
      const data = await fetchApi(`/words?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`);
      setWords(data.words || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load words', err);
      setError(err.message || "We couldn't load your words right now. Maybe try refreshing the page?");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadWords();
  }, [loadWords, router]);

  // Debounced search could be better, but for simplicity we'll use useEffect with search dependency
  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    try {
      setError('');
      await fetchApi(`/words/${id}`, { method: 'DELETE' });
      loadWords();
    } catch (err: any) {
      setError(err.message || "Oops! We couldn't delete that word. Please try again!");
    }
  };

  const handleStartEdit = (word: Word) => {
    setEditingId(word.id);
    setEditForm({ ...word });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      setError('');
      await fetchApi(`/words/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      loadWords();
    } catch (err: any) {
      setError(err.message || "We couldn't update your word. Give it another shot!");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL your words? This action cannot be undone.')) return;
    try {
      setLoading(true);
      setError('');
      await fetchApi('/words/all', { method: 'DELETE' });
      setPage(0);
      loadWords();
    } catch (err: any) {
      setError(err.message || "Oops! We couldn't clear your list. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 flex items-center text-sm font-medium mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Words</h1>
            <p className="text-sm text-gray-500 mt-1">Total: {total} words</p>
          </div>
          {words.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-red-100"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Words
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search words..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <th className="px-6 py-3 border-b border-gray-100">Original</th>
                  <th className="px-6 py-3 border-b border-gray-100">Translation</th>
                  <th className="px-6 py-3 border-b border-gray-100">Comment</th>
                  <th className="px-6 py-3 border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading words...
                    </td>
                  </tr>
                ) : words.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                      No words found
                    </td>
                  </tr>
                ) : (
                  words.map((word) => (
                    <tr key={word.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {editingId === word.id ? (
                          <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={editForm.source_word || ''}
                            onChange={(e) => setEditForm({ ...editForm, source_word: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{word.source_word}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === word.id ? (
                          <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={editForm.target_word || ''}
                            onChange={(e) => setEditForm({ ...editForm, target_word: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{word.target_word}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === word.id ? (
                          <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={editForm.comment || ''}
                            onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm text-gray-400 italic">{word.comment || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {editingId === word.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                                title="Cancel"
                              >
                                <span className="text-xs font-bold uppercase">Esc</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleStartEdit(word)}
                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium border border-blue-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(word.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
