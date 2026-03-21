'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/components/I18nContext';
import { getLanguageName } from '@/lib/languages';
import { Loader2, Search, ArrowLeft, BookOpen, ChevronRight, Globe, Layers, Filter, User, Plus, X, Save, Edit, BarChart3 } from 'lucide-react';

interface Playlist {
  id: string;
  user_id: string;
  creator_name?: string;
  title: string;
  description: string;
  created_at: string;
}

interface PublicList {
  id: string;
  user_id: string;
  creator_name?: string;
  title: string;
  description: string;
  source_lang: string;
  target_lang: string;
  level: string;
  created_at: string;
}

interface LangItem {
  code: string;
  name: string;
}

interface LangResponse {
  source: LangItem[];
  target: LangItem[];
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Public Word Lists',
  description: 'Browse and learn from public word lists shared by the community.',
  publisher: {
    '@type': 'Organization',
    name: 'WordsGo'
  }
};

export default function PublicListsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'lists' | 'playlists'>(
    (searchParams.get('tab') as 'lists' | 'playlists') || 'lists'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lists, setLists] = useState<PublicList[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLangs, setUserLangs] = useState({ source: '', target: '' });
  const [filterLevel, setFilterLevel] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [availableLangs, setAvailableLangs] = useState<LangResponse | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Playlist creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ title: '', description: '', list_ids: [] as string[] });
  const [loadingListsForPlaylist, setLoadingListsForPlaylist] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadLists = useCallback(async (source?: string, target?: string, level?: string) => {
    try {
      setLoading(true);
      setError('');
      let url = '/public-lists/';
      const params = new URLSearchParams();
      if (source && source !== '') params.append('source_lang', source);
      if (target && target !== '') params.append('target_lang', target);
      if (level && level !== '') params.append('level', level);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      const data = await fetchApi(url);
      setLists(data || []);
    } catch (err: any) {
      console.error('Failed to load public lists', err);
      setError(err.message || t('dashboard.public_lists.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchApi('/playlists');
      setPlaylists(data || []);
    } catch (err: any) {
      console.error('Failed to load playlists', err);
      setError(err.message || 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylist.title) return;
    
    try {
      setCreating(true);
      if (editingPlaylistId) {
        await fetchApi(`/playlists/${editingPlaylistId}`, {
          method: 'PUT',
          body: JSON.stringify(newPlaylist)
        });
      } else {
        await fetchApi('/playlists', {
          method: 'POST',
          body: JSON.stringify(newPlaylist)
        });
      }
      setShowCreateModal(false);
      setEditingPlaylistId(null);
      setNewPlaylist({ title: '', description: '', list_ids: [] });
      loadPlaylists();
    } catch (err: any) {
      setError(err.message || 'Failed to save playlist');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'playlists' || tab === 'lists') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);

    // Fetch available languages for filtering
    fetchApi('/users/lang')
      .then(data => {
        setAvailableLangs(data);
      })
      .catch(err => console.error('Failed to fetch languages', err));

    if (activeTab === 'lists') {
      if (token) {
        fetchApi('/words/GetMe')
          .then(data => {
            if (data?.id) {
              setCurrentUserId(data.id);
              setIsLoggedIn(true);
            } else {
              setIsLoggedIn(false);
            }
            const langData = data?.langCodeResp || data?.LangCodeResp;
            if (langData) {
              const source = langData.source || langData.Source || '';
              const target = langData.target || langData.Target || '';
              setUserLangs({ source, target });
              loadLists(source, target);
            } else {
              loadLists();
            }
          })
          .catch((err) => {
            setIsLoggedIn(false);
            loadLists();
          });
      } else {
        setIsLoggedIn(false);
        loadLists();
      }
    } else {
      if (token && !currentUserId) {
        fetchApi('/words/GetMe')
          .then(data => {
            if (data?.id) {
              setCurrentUserId(data.id);
              setIsLoggedIn(true);
            } else {
              setIsLoggedIn(false);
            }
          })
          .catch(() => {
            setIsLoggedIn(false);
          });
      } else if (!token) {
        setIsLoggedIn(false);
      }
      loadPlaylists();
    }
  }, [loadLists, loadPlaylists, activeTab, currentUserId]);

  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            {isLoggedIn && (
              <Link href="/dashboard" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 flex items-center text-sm font-medium mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('dashboard.public_lists.back_to_dashboard')}
              </Link>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Globe className="w-6 h-6 mr-2 text-blue-500" />
              {activeTab === 'lists' ? t('dashboard.public_lists.title') : (t('dashboard.public_lists.playlists_title') || 'Playlists')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === 'lists' ? t('dashboard.public_lists.subtitle') : (t('dashboard.public_lists.playlists_search_placeholder') || 'Explore collections of public word lists.')}
            </p>
          </div>
          {activeTab === 'playlists' && isLoggedIn && (
            <button
              onClick={async () => {
                setShowCreateModal(true);
                setLoadingListsForPlaylist(true);
                try {
                  const data = await fetchApi('/public-lists');
                  setLists(data || []);
                } finally {
                  setLoadingListsForPlaylist(false);
                }
              }}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('common.create')}
            </button>
          )}
        </div>

        <div className="mb-8 flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              setActiveTab('lists');
              router.push('/public-lists?tab=lists');
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'lists'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              {t('dashboard.public_lists.title')}
            </div>
            {activeTab === 'lists' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('playlists');
              router.push('/public-lists?tab=playlists');
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'playlists'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              {t('dashboard.public_lists.playlists_title') || 'Playlists'}
            </div>
            {activeTab === 'playlists' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'lists' ? t('dashboard.public_lists.search_placeholder') : (t('dashboard.public_lists.playlists_search_placeholder') || 'Search playlists...')}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="text-xl">×</span>
              </button>
            )}
          </div>
          {activeTab === 'lists' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap ${
                  isFilterOpen || userLangs.source || userLangs.target || filterLevel
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('common.filters')}
                {(userLangs.source || userLangs.target || filterLevel) && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </button>
              {(userLangs.source || userLangs.target || filterLevel || searchTerm) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setUserLangs({ source: '', target: '' });
                    setFilterLevel('');
                    loadLists('', '', '');
                  }}
                  className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center whitespace-nowrap"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {t('dashboard.public_lists.show_all_langs')}
                </button>
              )}
            </div>
          )}
        </div>

        {activeTab === 'lists' && isFilterOpen && availableLangs && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-gray-400" />
                  {t('dashboard.public_lists.source_lang')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={userLangs.source}
                  onChange={(e) => {
                    const newSource = e.target.value;
                    setUserLangs(prev => ({ ...prev, source: newSource }));
                    loadLists(newSource, userLangs.target);
                  }}
                >
                  <option value="">{t('common.all')}</option>
                  {availableLangs.source.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-400" />
                  {t('dashboard.public_lists.target_lang')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={userLangs.target}
                  onChange={(e) => {
                    const newTarget = e.target.value;
                    setUserLangs(prev => ({ ...prev, target: newTarget }));
                    loadLists(userLangs.source, newTarget, filterLevel);
                  }}
                >
                  <option value="">{t('common.all')}</option>
                  {availableLangs.target.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-amber-400" />
                  {t('dashboard.level') || 'Level'}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={filterLevel}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    setFilterLevel(newLevel);
                    loadLists(userLangs.source, userLangs.target, newLevel);
                  }}
                >
                  <option value="">{t('common.all')}</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setUserLangs({ source: '', target: '' });
                  setFilterLevel('');
                  loadLists('', '', '');
                }}
                className="text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>{activeTab === 'lists' ? t('dashboard.public_lists.loading') : (t('dashboard.public_lists.playlists_loading') || 'Loading playlists...')}</p>
          </div>
        ) : activeTab === 'lists' ? (
          filteredLists.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-20 text-center">
              <Layers className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('dashboard.public_lists.no_lists_found')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.public_lists.no_lists_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLists.map((list) => (
                <Link 
                  key={list.id} 
                  href={`/public-lists/${list.id}`}
                  className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {list.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {list.source_lang} → {list.target_lang}
                      </div>
                      <div className="flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                        {list.level}
                      </div>
                    </div>
                  </div>
                  
                  {list.creator_name && (
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mb-4">
                      <User className="w-3 h-3 mr-1" />
                      <span>{list.creator_name}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-6 h-10">
                    {list.description || t('dashboard.public_lists.no_description')}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center text-xs text-gray-400">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      <span>{t('dashboard.public_lists.view_words')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          filteredPlaylists.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-20 text-center">
              <Layers className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('dashboard.public_lists.playlists_no_found') || 'No playlists found'}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlaylists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/playlists/${playlist.id}`} className="flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {playlist.title}
                      </h3>
                    </Link>
                    {isLoggedIn && currentUserId === playlist.user_id && (
                      <button
                        onClick={async () => {
                          try {
                            setLoadingListsForPlaylist(true);
                            setEditingPlaylistId(playlist.id);
                            
                            // Load both: the playlist details and all available lists
                            const [playlistDetail, allLists] = await Promise.all([
                              fetchApi(`/playlists/${playlist.id}`),
                              fetchApi('/public-lists')
                            ]);
                            
                            setLists(allLists || []);
                            setNewPlaylist({
                              title: playlistDetail.title,
                              description: playlistDetail.description,
                              list_ids: (playlistDetail.lists || []).map((l: any) => l.id)
                            });
                            setShowCreateModal(true);
                          } catch (err) {
                            console.error('Failed to load playlist for editing', err);
                            setError('Failed to load playlist details');
                          } finally {
                            setLoadingListsForPlaylist(false);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {playlist.creator_name && (
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mb-4">
                      <User className="w-3 h-3 mr-1" />
                      <span>{playlist.creator_name}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-6 h-10">
                    {playlist.description || t('dashboard.public_lists.no_description')}
                  </p>
                  
                  <Link href={`/playlists/${playlist.id}`} className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center text-xs text-gray-400">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      <span>{t('dashboard.public_lists.playlists_view_collections') || 'View collections'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </Link>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  {editingPlaylistId ? <Save className="w-5 h-5 mr-2 text-blue-500" /> : <Plus className="w-5 h-5 mr-2 text-blue-500" />}
                  {editingPlaylistId ? t('dashboard.public_lists.playlists_edit') : t('dashboard.public_lists.playlists_create')}
                </h3>
                <button onClick={() => {
                  setShowCreateModal(false);
                  setEditingPlaylistId(null);
                  setNewPlaylist({ title: '', description: '', list_ids: [] });
                }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.title')}</label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('common.title')}
                    value={newPlaylist.title}
                    onChange={e => setNewPlaylist({...newPlaylist, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.description')}</label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('common.description')}
                    value={newPlaylist.description}
                    onChange={e => setNewPlaylist({...newPlaylist, description: e.target.value})}
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
                    {loadingListsForPlaylist ? (
                      <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /></div>
                    ) : lists.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">{t('dashboard.public_lists.playlists_no_lists') || 'No public lists available'}</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {lists
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
                              checked={newPlaylist.list_ids.includes(list.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewPlaylist(prev => ({ ...prev, list_ids: [...prev.list_ids, list.id] }));
                                } else {
                                  setNewPlaylist(prev => ({ ...prev, list_ids: prev.list_ids.filter(id => id !== list.id) }));
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
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingPlaylistId(null);
                      setNewPlaylist({ title: '', description: '', list_ids: [] });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newPlaylist.title || newPlaylist.list_ids.length === 0}
                    className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {editingPlaylistId ? t('common.save') : t('common.create')}
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
