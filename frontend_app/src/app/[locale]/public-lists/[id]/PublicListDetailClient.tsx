'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/components/I18nContext';
import { Loader2, ArrowLeft, Plus, CheckCircle, Globe, BookOpen, Edit2, Save, X, Trash2, Languages, ArrowRight } from 'lucide-react';

interface Word {
  id: string;
  source_word: string;
  target_word: string;
  comment: string;
}

interface PublicListDetail {
  id: string;
  user_id: string;
  title: string;
  description: string;
  source_lang: string;
  target_lang: string;
  items: Word[];
}

export default function PublicListDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [list, setList] = useState<PublicListDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editItems, setEditItems] = useState<Word[]>([]);
  const [newItem, setNewItem] = useState({ source_word: '', target_word: '', comment: '' });
  const [isTranslatingNew, setIsTranslatingNew] = useState(false);
  const [duplicateWords, setDuplicateWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Try to get current user from API
    const loadUserAndList = async () => {
      try {
        setLoading(true);
        
        if (token) {
          // Load user first
          try {
            const user = await fetchApi('/words/GetMe');
            const uid = user?.id || user?.ID;
            if (uid) {
              setCurrentUser({ id: uid.toString() });
            }
          } catch (userErr) {
            console.warn('Could not load user profile, continuing as guest', userErr);
          }
        }

        // Load list (accessible without token)
        const data = await fetchApi(`/public-lists/${id}`);
        setList(data);
        // Initialize edit states
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditItems(data.items || []);
      } catch (err: any) {
        console.error('Failed to load data', err);
        setError(err.message || t('dashboard.public_lists.load_error'));
      } finally {
        setLoading(false);
      }
    };

    loadUserAndList();
  }, [id, t]);

  useEffect(() => {
    const items = isEditing ? editItems : (list?.items || []);
    const words = items.map(w => w.source_word.toLowerCase().trim()).filter(Boolean);
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    for (const word of words) {
      if (seen.has(word)) {
        duplicates.add(word);
      }
      seen.add(word);
    }
    setDuplicateWords(duplicates);
    
    if (duplicates.size === 0 && (error.includes('already in the list') || error.includes('duplicate words') || error.includes('remove duplicate'))) {
      setError('');
    }
  }, [editItems, list?.items, isEditing, error]);

  const handleAddToList = async () => {
    try {
      setAdding(true);
      setError('');
      await fetchApi(`/public-lists/${id}/add`, { method: 'POST' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to add list to user', err);
      setError(err.message || t('dashboard.public_lists.detail.added_error'));
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = () => {
    if (!list) return;
    setEditTitle(list.title);
    setEditDescription(list.description);
    setEditItems([...(list.items || [])]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      setError(t('dashboard.list_title_label'));
      return;
    }
    if (editItems.length === 0) {
      setError(t('dashboard.no_words_to_save'));
      return;
    }

    const words = editItems.map(item => item.source_word.toLowerCase().trim());
    const hasDuplicates = words.some((word, index) => words.indexOf(word) !== index);
    if (hasDuplicates) {
      setError(t('dashboard.public_lists.detail.duplicate_error'));
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updatedData = await fetchApi(`/public-lists/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          source_lang: list?.source_lang,
          target_lang: list?.target_lang,
          words: editItems
        })
      });
      
      if (list) {
        setList({
          ...list,
          title: editTitle,
          description: editDescription,
          items: editItems
        });
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update public list', err);
      setError(err.message || t('dashboard.public_lists.detail.added_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.source_word.trim() || !newItem.target_word.trim()) {
      setError(t('dashboard.inline_add_error'));
      return;
    }

    const isDuplicate = editItems.some(item => 
      item.source_word.toLowerCase().trim() === newItem.source_word.toLowerCase().trim()
    );
    if (isDuplicate) {
      setError(t('dashboard.duplicate_word_error', { word: newItem.source_word }));
      return;
    }

    const itemToAdd = {
      id: `new-${Date.now()}`,
      ...newItem
    };
    setEditItems([itemToAdd, ...editItems]);
    setNewItem({ source_word: '', target_word: '', comment: '' });
    setError('');
  };

  const handleTranslateNew = async () => {
    if (!newItem.source_word || newItem.target_word) return;

    try {
      setIsTranslatingNew(true);
      const response = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_word: newItem.source_word,
          target_word: ''
        })
      });
      
      if (response && response.target_word) {
        setNewItem(prev => ({ ...prev, target_word: response.target_word }));
      }
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setIsTranslatingNew(false);
    }
  };

  const isOwner = currentUser && list && (currentUser.id === list.user_id || currentUser.id === (list as any).UserID);
  const isLoggedIn = !!currentUser;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('common.no_data')}</h1>
        <Link href="/public-lists" className="text-blue-600 hover:underline">{t('dashboard.public_lists.back_to_dashboard')}</Link>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.title,
    description: list.description,
    numberOfItems: list.items?.length || 0,
    itemListElement: (list.items || []).map((word, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: word.source_word,
      description: word.target_word
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {isLoggedIn && (
            <Link href="/public-lists" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 flex items-center text-sm font-medium mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> {t('dashboard.public_lists.detail.back_to_lists')}
            </Link>
          )}
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
               <div className="flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                {list.source_lang} → {list.target_lang}
              </div>
              {isOwner && !isEditing && (
                <button 
                  onClick={handleStartEdit}
                  className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> {t('dashboard.public_lists.detail.edit_list')}
                </button>
              )}
            </div>
            
            <div className="max-w-2xl">
              {isEditing ? (
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-3xl font-bold bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
                    placeholder={t('dashboard.list_title_placeholder')}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none resize-none"
                    placeholder={t('dashboard.list_desc_placeholder')}
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{list.title}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">{list.description || t('dashboard.public_lists.no_description')}</p>
                </>
              )}
              
              <div className="flex flex-wrap gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:bg-green-400"
                    >
                      {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                      {t('dashboard.public_lists.detail.save_changes')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95"
                    >
                      <X className="w-5 h-5 mr-2" />
                      {t('dashboard.public_lists.detail.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    {isLoggedIn ? (
                      <button
                        onClick={handleAddToList}
                        disabled={adding || success}
                        className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
                          success 
                            ? 'bg-green-500 text-white cursor-default' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                        }`}
                      >
                        {adding ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : success ? (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        ) : (
                          <Plus className="w-5 h-5 mr-2" />
                        )}
                        {success ? t('dashboard.public_lists.detail.added_success') : t('dashboard.public_lists.detail.add_to_my_list')}
                      </button>
                    ) : (
                      <Link
                        href="/register"
                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        {t('dashboard.public_lists.detail.add_to_my_list')}
                      </Link>
                    )}
                    
                    <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium border border-gray-100 dark:border-gray-700">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                      {t('dashboard.public_lists.detail.items_count', { count: (list.items || []).length })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">{t('dashboard.original')}</th>
                  <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">{t('dashboard.translation')}</th>
                  <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">{t('dashboard.comment')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(isEditing ? editItems : (list.items || [])).map((word, index) => (
                  <tr key={word.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">{word.source_word}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{word.target_word}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500 italic">{word.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
