'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { Loader2, Save, User as UserIcon, Mail, Globe, Lock, LayoutDashboard } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import { useTranslation } from '@/components/I18nContext';

interface LangItem {
  code: string;
  name: string;
}

interface LangResponse {
  source: LangItem[];
  target: LangItem[];
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  langCodeResp: {
    source: string;
    target: string;
  };
}

export default function Profile() {
  const router = useRouter();
  const { t, setLang, lang: currentLocale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [langs, setLangs] = useState<LangResponse | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    source_lang: '',
    target_lang: '',
    password: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    Promise.all([
      fetchApi('/words/GetMe'),
      fetchApi('/users/lang')
    ])
      .then(([userData, langData]) => {
        if (!isMounted) return;
        setUser(userData);
        setLangs(langData);
        
        const sourceLang = userData.langCodeResp?.source || userData.source_lang;
        
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          source_lang: sourceLang || '',
          target_lang: userData.langCodeResp?.target || userData.target_lang || '',
          password: '',
        });
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load profile data', err);
        router.push('/login');
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        source_lang: formData.source_lang,
        target_lang: formData.target_lang,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await fetchApi(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      if (formData.source_lang) {
        setLang(formData.source_lang);
      }

      sendGAEvent('event', 'update_profile', { user_id: user.id });
      setMessage({ type: 'success', text: t('profile.update_success') });
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Update local user state if needed, or just refetch
      const updatedUser = await fetchApi('/words/GetMe');
      setUser(updatedUser);
      
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('profile.update_error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-synaply-blue dark:text-synaply-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden">
          <div className="p-6 border-b border-white/20 dark:border-gray-800/50 bg-white/50 dark:bg-gray-800/30 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold synaply-gradient-text tracking-tight uppercase">
                {t('profile.title')}
              </h1>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">{t('profile.subtitle')}</p>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-bold rounded-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
              {t('common.dashboard')}
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t('profile.first_name')}
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-xl border-white/20 dark:border-gray-700 border px-4 py-2.5 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-800/20 focus:border-synaply-blue dark:focus:border-synaply-cyan focus:ring-1 focus:ring-synaply-blue dark:focus:ring-synaply-cyan sm:text-sm transition-all shadow-inner"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t('profile.last_name')}
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-xl border-white/20 dark:border-gray-700 border px-4 py-2.5 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-800/20 focus:border-synaply-blue dark:focus:border-synaply-cyan focus:ring-1 focus:ring-synaply-blue dark:focus:ring-synaply-cyan sm:text-sm transition-all shadow-inner"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center">
                <Mail className="w-4 h-4 mr-1 text-gray-400" />
                {t('profile.email')}
              </label>
              <input
                type="email"
                required
                className="block w-full rounded-xl border-white/20 dark:border-gray-700 border px-4 py-2.5 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-800/20 focus:border-synaply-blue dark:focus:border-synaply-cyan focus:ring-1 focus:ring-synaply-blue dark:focus:ring-synaply-cyan sm:text-sm transition-all shadow-inner"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/20 dark:border-gray-800/50">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center">
                  <Globe className="w-4 h-4 mr-1 text-gray-400" />
                  {t('profile.interface_lang')}
                </label>
                <select
                  className="block w-full rounded-xl border-white/20 dark:border-gray-700 border px-4 py-2.5 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-800/20 focus:border-synaply-blue dark:focus:border-synaply-cyan focus:ring-1 focus:ring-synaply-blue dark:focus:ring-synaply-cyan sm:text-sm transition-all shadow-inner"
                  value={formData.source_lang}
                  onChange={e => setFormData({ ...formData, source_lang: e.target.value })}
                >
                  {langs?.source.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center">
                  <Globe className="w-4 h-4 mr-1 text-synaply-blue dark:text-synaply-cyan" />
                  {t('profile.learning_lang')}
                </label>
                <select
                  className="block w-full rounded-xl border-white/20 dark:border-gray-700 border px-4 py-2.5 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-800/20 focus:border-synaply-blue dark:focus:border-synaply-cyan focus:ring-1 focus:ring-synaply-blue dark:focus:ring-synaply-cyan sm:text-sm transition-all shadow-inner"
                  value={formData.target_lang}
                  onChange={e => setFormData({ ...formData, target_lang: e.target.value })}
                >
                  {langs?.target.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 dark:border-gray-800/50">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center">
                <Lock className="w-4 h-4 mr-1 text-gray-400" />
                {t('profile.change_password')}
              </label>
              <input
                type="password"
                className="block w-full rounded-xl border-white/20 dark:border-gray-700 border px-4 py-2.5 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-800/20 focus:border-synaply-blue dark:focus:border-synaply-cyan focus:ring-1 focus:ring-synaply-blue dark:focus:ring-synaply-cyan sm:text-sm transition-all shadow-inner"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {message.text && (
              <div className={`text-sm p-3 rounded-md border ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-widest"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-sm font-bold rounded-full shadow-lg shadow-synaply-blue-shadow text-white synaply-gradient-bg hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-synaply-purple disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('profile.updating')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
