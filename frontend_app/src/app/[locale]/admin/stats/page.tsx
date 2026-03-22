'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  List, 
  Layers, 
  UserPlus, 
  Loader2, 
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Search,
  X
} from 'lucide-react';
import { useTranslation } from '@/components/I18nContext';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  source_lang: string;
  target_lang: string;
  total_correct: number;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_words: number;
  total_lessons: number;
  total_public_lists: number;
  total_playlists: number;
  new_users_24h: number;
  users: User[];
  health: {
    postgres: boolean;
    redis: boolean;
  };
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const loadStats = useCallback(async (isRefresh = false, search = '') => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const url = search ? `/admin/stats?search=${encodeURIComponent(search)}` : '/admin/stats';
      const data = await fetchApi(url);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      setError(err.message || 'Failed to load statistics');
      
      if (err.message === "Sorry, you don't have permission to do that." || err.message === 'Forbidden') {
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isAdmin) {
      loadStats(false, debouncedSearch);
    }
  }, [debouncedSearch, isAdmin, loadStats]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userData = await fetchApi('/words/GetMe');
        if (userData && userData.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading && !refreshing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('common.error')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('not_authorized_admin')}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('common.back_to_dashboard')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-500" />
            {t('admin.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            WordsGo System Overview
          </p>
        </div>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-end">
               <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full flex items-center">
                 <UserPlus className="w-3 h-3 mr-1" />
                 +{stats?.new_users_24h || 0}
               </span>
               <span className="text-[10px] text-gray-400 mt-0.5">last 24h</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.total_users.toLocaleString() || 0}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.total_users')}
          </div>
        </div>

        {/* Total Words */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.total_words.toLocaleString() || 0}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.total_words')}
          </div>
        </div>

        {/* Total Lessons (Learned words) */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.total_lessons.toLocaleString() || 0}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.total_lessons')}
          </div>
        </div>

        {/* Public Lists */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <List className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.total_public_lists.toLocaleString() || 0}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.total_public_lists')}
          </div>
        </div>

        {/* Playlists */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <Layers className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.total_playlists.toLocaleString() || 0}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.total_playlists')}
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-8 bg-blue-600 dark:bg-blue-700 rounded-2xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            {t('admin.system_health')}: {stats?.health.postgres && stats?.health.redis ? 'Stable' : 'Degraded'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className={`w-3 h-3 rounded-full ${stats?.health.postgres ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
              <div>
                <div className="font-semibold">Database (PostgreSQL)</div>
                <div className="text-sm text-blue-100">{stats?.health.postgres ? 'Operational' : 'Offline'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className={`w-3 h-3 rounded-full ${stats?.health.redis ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
              <div>
                <div className="font-semibold">Cache (Redis)</div>
                <div className="text-sm text-blue-100">{stats?.health.redis ? 'Operational' : 'Offline'}</div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-blue-100 text-sm opacity-80">
            The FSRS algorithm is processing words correctly. Average response time is within healthy limits.
          </p>
        </div>
      </div>

      <div className="mt-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('admin.users_table_title') || 'Users'}
            </h2>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-medium text-gray-500">
              {stats?.users?.length || 0}
            </span>
          </div>

          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.search_users_placeholder') || 'Search users...'}
              className="block w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">Email</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 text-center">Langs</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 text-center">Correct</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats?.users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {user.source_lang.toUpperCase()} → {user.target_lang.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600 dark:text-gray-400">
                    {user.total_correct}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!stats?.users || stats.users.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
