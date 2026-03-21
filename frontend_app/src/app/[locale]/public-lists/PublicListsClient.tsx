'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/components/I18nContext';
import { getLanguageName } from '@/lib/languages';
import { Loader2, Search, ArrowLeft, BookOpen, ChevronRight, Globe, Layers, Filter } from 'lucide-react';

interface PublicList {
  id: string;
  user_id: string;
  title: string;
  description: string;
  source_lang: string;
  target_lang: string;
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lists, setLists] = useState<PublicList[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLangs, setUserLangs] = useState({ source: '', target: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [availableLangs, setAvailableLangs] = useState<LangResponse | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const loadLists = useCallback(async (source?: string, target?: string) => {
    try {
      setLoading(true);
      setError('');
      let url = '/public-lists/';
      const params = new URLSearchParams();
      if (source && source !== '') params.append('source_lang', source);
      if (target && target !== '') params.append('target_lang', target);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      console.log('PublicListsClient: Fetching lists from URL:', url);
      const data = await fetchApi(url);
      console.log('PublicListsClient: Lists received, count:', data?.length);
      setLists(data || []);
    } catch (err: any) {
      console.error('Failed to load public lists', err);
      setError(err.message || t('dashboard.public_lists.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);

    console.log('PublicListsClient: useEffect triggered, token exists:', !!token);

    // Fetch available languages for filtering
    fetchApi('/users/lang')
      .then(data => {
        setAvailableLangs(data);
      })
      .catch(err => console.error('Failed to fetch languages', err));

    if (token) {
      fetchApi('/words/GetMe')
        .then(data => {
          console.log('PublicListsClient: GetMe data received', data);
          const uid = data?.id || data?.ID;
          if (uid) {
            setIsLoggedIn(true);
          }
          const langData = data?.langCodeResp || data?.LangCodeResp;
          if (langData) {
            const source = langData.source || langData.Source || '';
            const target = langData.target || langData.Target || '';
            console.log('PublicListsClient: User languages found:', { source, target });
            setUserLangs({ source, target });
            loadLists(source, target);
          } else {
            console.log('PublicListsClient: No user languages found, loading all');
            loadLists();
          }
        })
        .catch((err) => {
          console.error('PublicListsClient: GetMe failed', err);
          setIsLoggedIn(false);
          loadLists();
        });
    } else {
      console.log('PublicListsClient: No token, loading all');
      setIsLoggedIn(false);
      loadLists();
    }
  }, [loadLists]);

  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description.toLowerCase().includes(searchTerm.toLowerCase())
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
              {t('dashboard.public_lists.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('dashboard.public_lists.subtitle')}
            </p>
          </div>
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
              placeholder={t('dashboard.public_lists.search_placeholder')}
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
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap ${
                isFilterOpen || userLangs.source || userLangs.target
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('common.filters')}
              {(userLangs.source || userLangs.target) && (
                <span className="ml-2 w-2 h-2 rounded-full bg-blue-500"></span>
              )}
            </button>
            {(userLangs.source || userLangs.target || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setUserLangs({ source: '', target: '' });
                  loadLists('', '');
                }}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center whitespace-nowrap"
              >
                <Layers className="w-4 h-4 mr-2" />
                {t('dashboard.public_lists.show_all_langs')}
              </button>
            )}
          </div>
        </div>

        {isFilterOpen && availableLangs && (
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
                    loadLists(userLangs.source, newTarget);
                  }}
                >
                  <option value="">{t('common.all')}</option>
                  {availableLangs.target.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setUserLangs({ source: '', target: '' });
                  loadLists('', '');
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
            <p>{t('dashboard.public_lists.loading')}</p>
          </div>
        ) : filteredLists.length === 0 ? (
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
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {list.title}
                  </h3>
                  <div className="flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    {list.source_lang} → {list.target_lang}
                  </div>
                </div>
                
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
        )}
      </div>
    </div>
  );
}
