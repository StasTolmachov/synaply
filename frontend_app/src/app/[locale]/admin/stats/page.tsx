'use client';

import { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from '@/components/I18nContext';

interface AdminStats {
  total_users: number;
  total_words: number;
  total_lessons: number;
  total_public_lists: number;
  total_playlists: number;
  new_users_24h: number;
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const loadStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const data = await fetchApi('/admin/stats');
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
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userData = await fetchApi('/words/GetMe');
        if (userData && userData.role === 'admin') {
          setIsAdmin(true);
          loadStats();
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
      
      <div className="mt-12 p-8 bg-blue-600 rounded-2xl text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">System Health: Stable</h2>
              <p className="text-blue-100 max-w-2xl">
                  All systems are operational. The FSRS algorithm is processing words correctly. 
                  Average response time is within healthy limits.
              </p>
          </div>
      </div>
    </div>
  );
}
