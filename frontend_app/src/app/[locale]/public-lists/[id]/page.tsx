'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/components/I18nContext';
import { Loader2, ArrowLeft, Plus, CheckCircle, Globe, BookOpen, Edit2, Save, X, Trash2, Languages } from 'lucide-react';

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

export default function PublicListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
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
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Try to get current user from API
    const loadUserAndList = async () => {
      try {
        setLoading(true);
        
        // Load user first
        const user = await fetchApi('/words/GetMe');
        const uid = user.id || user.ID;
        if (uid) {
          setCurrentUser({ id: uid.toString() });
        }

        // Load list
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
  }, [id, router]);

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
      setError(t('dashboard.list_title_label')); // Fallback to label if no specific error key
      return;
    }
    if (editItems.length === 0) {
      setError(t('dashboard.no_words_to_save'));
      return;
    }

    // Final duplicate check before saving
    const words = editItems.map(item => item.source_word.toLowerCase().trim());
    const hasDuplicates = words.some((word, index) => words.indexOf(word) !== index);
    if (hasDuplicates) {
      setError(t('dashboard.public_lists.detail.duplicate_error'));
      return;
    }

    try {
      setSaving(true);
      setError('');
      await fetchApi(`/public-lists/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          source_lang: list?.source_lang,
          target_lang: list?.target_lang,
          words: editItems
        })
      });
      
      // Update local state
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

  const handleUpdateItem = (index: number, field: keyof Word, value: string) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = editItems.filter((_, i) => i !== index);
    setEditItems(newItems);
  };

  const handleAddItem = () => {
    if (!newItem.source_word.trim() || !newItem.target_word.trim()) {
      setError(t('dashboard.inline_add_error'));
      return;
    }

    // Check for duplicates
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

  const handleTranslateItem = async (index: number) => {
    const item = editItems[index];
    if (!item.source_word || item.target_word) return;

    try {
      const response = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_word: item.source_word,
          target_word: ''
        })
      });
      
      if (response && response.target_word) {
        handleUpdateItem(index, 'target_word', response.target_word);
      }
    } catch (err) {
      console.error('Translation failed', err);
    }
  };

  const isOwner = currentUser && list && (currentUser.id === list.user_id || currentUser.id === (list as any).UserID);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/public-lists" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 flex items-center text-sm font-medium mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('dashboard.public_lists.back_to_dashboard')}
          </Link>
          
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
                  {isEditing && (
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 text-right">
                      {/* Empty header for the add/actions column */}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isEditing && (
                  <tr className="bg-blue-50/30 dark:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder={t('dashboard.new_word_placeholder')}
                        value={newItem.source_word}
                        onChange={(e) => setNewItem({ ...newItem, source_word: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="bg-transparent border-b border-blue-500/30 focus:border-blue-500 outline-none w-full text-sm font-semibold text-gray-900 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={t('dashboard.translation_placeholder_inline')}
                          value={newItem.target_word}
                          onChange={(e) => setNewItem({ ...newItem, target_word: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                          className="bg-transparent border-b border-blue-500/30 focus:border-blue-500 outline-none w-full text-sm text-gray-600 dark:text-gray-300"
                        />
                        {newItem.source_word && !newItem.target_word && (
                          <button
                            onClick={handleTranslateNew}
                            disabled={isTranslatingNew}
                            className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                            title={t('dashboard.translate')}
                          >
                            {isTranslatingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder={t('dashboard.comment_placeholder_inline')}
                        value={newItem.comment}
                        onChange={(e) => setNewItem({ ...newItem, comment: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="bg-transparent border-b border-blue-500/30 focus:border-blue-500 outline-none w-full text-sm italic text-gray-400 dark:text-gray-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={handleAddItem}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95 shadow-md border border-transparent"
                      >
                        <Plus className="w-4 h-4 mr-1" /> {t('common.add')}
                      </button>
                    </td>
                  </tr>
                )}
                {(isEditing ? editItems : (list.items || [])).map((word, idx) => {
                  const isDuplicate = duplicateWords.has(word.source_word.toLowerCase().trim());
                  return (
                    <tr key={idx} className={`hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors ${isDuplicate ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}>
                      <td className={`px-6 py-4 text-sm font-semibold ${isDuplicate ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={word.source_word}
                            onChange={(e) => handleUpdateItem(idx, 'source_word', e.target.value)}
                            className={`bg-transparent border-b border-blue-500/30 focus:border-blue-500 outline-none w-full ${isDuplicate ? 'text-red-600 dark:text-red-400' : ''}`}
                          />
                        ) : word.source_word}
                      </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={word.target_word}
                          onChange={(e) => handleUpdateItem(idx, 'target_word', e.target.value)}
                          className="bg-transparent border-b border-blue-500/30 focus:border-blue-500 outline-none w-full"
                        />
                      ) : word.target_word}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
                      {isEditing ? (
                        <input
                          type="text"
                          value={word.comment}
                          onChange={(e) => handleUpdateItem(idx, 'comment', e.target.value)}
                          className="bg-transparent border-b border-blue-500/30 focus:border-blue-500 outline-none w-full"
                          placeholder={t('dashboard.comment_placeholder_inline')}
                        />
                      ) : (word.comment || '-')}
                    </td>
                    {isEditing && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {word.source_word && (
                            <button
                              onClick={() => handleTranslateItem(idx)}
                              title="Auto-translate"
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                              <Languages className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteItem(idx)}
                            title="Delete word"
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
                {((isEditing ? editItems : (list.items || [])).length === 0) && (
                  <tr>
                    <td colSpan={isEditing ? 4 : 3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 italic">
                      {t('dashboard.no_words_found_simple')}
                    </td>
                  </tr>
                )}
                {isEditing && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      {/* Removed individual Add New Word button at the bottom as we have a constant row at the top */}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
