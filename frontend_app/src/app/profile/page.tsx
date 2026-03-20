'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Loader2, Save, User as UserIcon, Mail, Globe, Lock, LayoutDashboard } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';

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

    Promise.all([
      fetchApi('/words/GetMe'),
      fetchApi('/users/lang')
    ])
      .then(([userData, langData]) => {
        setUser(userData);
        setLangs(langData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          source_lang: userData.langCodeResp?.source || '',
          target_lang: userData.langCodeResp?.target || '',
          password: '',
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load profile data', err);
        router.push('/login');
      });
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

      sendGAEvent('event', 'update_profile', { user_id: user.id });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Update local user state if needed, or just refetch
      const updatedUser = await fetchApi('/words/GetMe');
      setUser(updatedUser);
      
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                User Profile
              </h2>
              <p className="text-sm text-gray-500 mt-1">Manage your personal information and language settings</p>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 mr-2 text-gray-500" />
              Dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Mail className="w-4 h-4 mr-1 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="w-4 h-4 mr-1 text-gray-400" />
                  Source Language (I speak)
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  value={formData.source_lang}
                  onChange={e => setFormData({ ...formData, source_lang: e.target.value })}
                >
                  {langs?.source.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="w-4 h-4 mr-1 text-blue-400" />
                  Target Language (I learn)
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  value={formData.target_lang}
                  onChange={e => setFormData({ ...formData, target_lang: e.target.value })}
                >
                  {langs?.target.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Lock className="w-4 h-4 mr-1 text-gray-400" />
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {message.text && (
              <div className={`text-sm p-3 rounded-md border ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {message.text}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
