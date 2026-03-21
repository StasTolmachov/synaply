'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { Loader2, Search, Trash2, Save, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/components/I18nContext';

interface Word {
  id: string;
  source_word: string;
  target_word: string;
  comment: string;
}

export default function WordsList() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Word>>({});

  const loadWords = useCallback(async (isMounted: boolean) => {
    try {
      setLoading(true);
      setError('');
      const offset = page * limit;
      const data = await fetchApi(`/words?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`);
      if (!isMounted) return;
      setWords(data.words || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      if (!isMounted) return;
      console.error('Failed to load words', err);
      setError(err.message || t('common.loading_error'));
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [search, page, t]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    let isMounted = true;
    loadWords(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadWords, router]);

  // Debounced search could be better, but for simplicity we'll use useEffect with search dependency
  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('dashboard.delete_confirm'))) return;
    try {
      setError('');
      await fetchApi(`/words/${id}`, { method: 'DELETE' });
      loadWords(true);
    } catch (err: any) {
      setError(err.message || t('common.error'));
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
      loadWords(true);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(t('dashboard.delete_all_confirm'))) return;
    try {
      setLoading(true);
      setError('');
      await fetchApi('/words/all', { method: 'DELETE' });
      setPage(0);
      loadWords(true);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 flex items-center text-sm font-medium mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back_to_dashboard')}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.words_list_title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.total_words', { count: total.toString() })}</p>
          </div>
          {words.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors border border-red-100 dark:border-red-900/30"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('dashboard.delete_all_btn')}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('dashboard.search_placeholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                  <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">{t('dashboard.original')}</th>
                  <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">{t('dashboard.translation')}</th>
                  <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">{t('dashboard.comment')}</th>
                  <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 text-right">{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      {t('dashboard.loading_words')}
                    </td>
                  </tr>
                ) : words.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                      {t('dashboard.no_words_found_simple')}
                    </td>
                  </tr>
                ) : (
                  words.map((word) => (
                    <tr key={word.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        {editingId === word.id ? (
                          <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={editForm.source_word || ''}
                            onChange={(e) => setEditForm({ ...editForm, source_word: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{word.source_word}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === word.id ? (
                          <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={editForm.target_word || ''}
                            onChange={(e) => setEditForm({ ...editForm, target_word: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm text-gray-600 dark:text-gray-300">{word.target_word}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === word.id ? (
                          <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={editForm.comment || ''}
                            onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">{word.comment || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {editingId === word.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title={t('common.save')}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title={t('common.cancel')}
                              >
                                <span className="text-xs font-bold uppercase">{t('common.esc')}</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleStartEdit(word)}
                                className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-xs font-medium border border-blue-100 dark:border-blue-800"
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                onClick={() => handleDelete(word.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title={t('common.delete')}
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
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-500">
                {t('dashboard.page_info', { current: (page + 1).toString(), total: totalPages.toString() })}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  title={t('dashboard.previous')}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  title={t('dashboard.next')}
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
