'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/components/I18nContext';
import { Loader2, ArrowLeft, BookOpen, ChevronRight, User, Layers, Edit, Save, Plus, X, Search } from 'lucide-react';

interface PublicList {
  id: string;
  user_id: string;
  creator_name?: string;
  title: string;
  description: string;
  source_lang: string;
  target_lang: string;
  level: string;
}

interface PlaylistDetail {
  id: string;
  user_id: string;
  creator_name?: string;
  title: string;
  description: string;
  lists: PublicList[];
}

export default function PlaylistDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [allPublicLists, setAllPublicLists] = useState<PublicList[]>([]);
  const [loadingAllLists, setLoadingAllLists] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [editForm, setEditForm] = useState({ title: '', description: '', list_ids: [] as string[] });

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/playlists/${id}`);
      setPlaylist(data);
    } catch (err: any) {
      console.error('Failed to load playlist', err);
      setError(err.message || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();

    // Check user login and get current user ID
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchApi('/words/GetMe')
        .then(data => {
          if (data?.id) {
            setCurrentUserId(data.id);
          } else {
            // If we have a token but GetMe failed (e.g. 401), token might be invalid
            if (typeof window !== 'undefined' && !data) {
               // fetchApi already handles 401 for GetMe by returning data (which will be null if failed)
            }
          }
        })
        .catch(() => {});
    }
  }, [id]);

  const handleOpenEdit = async () => {
    if (!playlist) return;
    
    setEditForm({
      title: playlist.title,
      description: playlist.description,
      list_ids: (playlist.lists || []).map(l => l.id)
    });
    setShowEditModal(true);
    
    if (allPublicLists.length === 0) {
      try {
        setLoadingAllLists(true);
        const data = await fetchApi('/public-lists');
        setAllPublicLists(data || []);
      } catch (err) {
        console.error('Failed to load public lists', err);
      } finally {
        setLoadingAllLists(false);
      }
    }
  };

  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title) return;
    
    try {
      setSaving(true);
      await fetchApi(`/playlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setShowEditModal(false);
      loadPlaylist();
    } catch (err: any) {
      setError(err.message || 'Failed to update playlist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('dashboard.public_lists.playlists_detail.not_found') || 'Playlist not found'}
        </h1>
        <Link href="/public-lists?tab=playlists" className="text-blue-600 hover:underline">
          {t('dashboard.public_lists.playlists_detail.back_to_playlists') || 'Back to playlists'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/public-lists?tab=playlists" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 flex items-center text-sm font-medium mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('dashboard.public_lists.playlists_detail.back_to_playlists') || 'Back to playlists'}
          </Link>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <div className="flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                {t('dashboard.public_lists.playlists_detail.playlist_label') || 'Playlist'}
              </div>
            </div>
            
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{playlist.title}</h1>
                {currentUserId === playlist.user_id && (
                  <button
                    onClick={handleOpenEdit}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-95"
                    title={t('common.edit')}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>
              {playlist.creator_name && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <User className="w-4 h-4 mr-2" />
                  <span>{playlist.creator_name}</span>
                </div>
              )}
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                {playlist.description || t('dashboard.public_lists.playlists_detail.no_description') || 'No description'}
              </p>
              
              <div className="flex items-center px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium border border-gray-100 dark:border-gray-700 w-fit">
                <Layers className="w-4 h-4 mr-2 text-gray-400" />
                {t('dashboard.public_lists.playlists_detail.items_count', { count: playlist.lists?.length || 0 }) || `${playlist.lists?.length || 0} collections`}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center px-2">
            {t('dashboard.public_lists.playlists_detail.collections_in_playlist') || 'Collections in this playlist'}
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {(playlist.lists || []).map((list) => (
              <Link 
                key={list.id} 
                href={`/public-lists/${list.id}`}
                className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                    {list.title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      {list.source_lang} → {list.target_lang}
                    </div>
                    {list.level && (
                      <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                        {list.level}
                      </div>
                    )}
                    {list.creator_name && (
                      <div className="flex items-center text-xs text-gray-400">
                        <User className="w-3 h-3 mr-1" />
                        <span>{list.creator_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <Save className="w-5 h-5 mr-2 text-blue-500" />
                  {t('dashboard.public_lists.playlists_edit') || 'Edit Playlist'}
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdatePlaylist} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.title')}</label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('common.title')}
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.description')}</label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('common.description')}
                    value={editForm.description}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dashboard.public_lists.playlists_select_lists') || 'Select Word Lists'}</label>
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border pl-9 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('dashboard.public_lists.playlists_list_search_placeholder') || "Search word lists..."}
                      value={listSearchTerm}
                      onChange={e => setListSearchTerm(e.target.value)}
                    />
                    {listSearchTerm && (
                      <button 
                        type="button"
                        onClick={() => setListSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {loadingAllLists ? (
                      <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /></div>
                    ) : allPublicLists.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">{t('dashboard.public_lists.playlists_no_lists') || 'No public lists available'}</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {allPublicLists
                          .filter(list => 
                            list.title.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
                            list.source_lang.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
                            list.target_lang.toLowerCase().includes(listSearchTerm.toLowerCase())
                          )
                          .map(list => (
                          <label key={list.id} className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={editForm.list_ids.includes(list.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm(prev => ({ ...prev, list_ids: [...prev.list_ids, list.id] }));
                                } else {
                                  setEditForm(prev => ({ ...prev, list_ids: prev.list_ids.filter(id => id !== list.id) }));
                                }
                              }}
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {list.title}
                                {list.level && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-800/30">
                                    {list.level}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">{list.source_lang} → {list.target_lang}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !editForm.title || editForm.list_ids.length === 0}
                    className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
