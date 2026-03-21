'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { sendGAEvent } from '@next/third-parties/google';
import { useTranslation } from '@/components/I18nContext';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    source_lang: '',
    target_lang: '',
  });
  const [languages, setLanguages] = useState<{ source: { code: string; name: string }[], target: { code: string; name: string }[] }>({ source: [], target: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, setLang } = useTranslation();

  useEffect(() => {
    fetchApi('/users/lang')
      .then((data) => {
        setLanguages(data);
        if (data.source?.length > 0 && data.target?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            source_lang: data.source[0].code,
            target_lang: data.target[0].code,
          }));
        }
      })
      .catch((err) => console.error('Failed to load languages', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.source_lang === formData.target_lang) {
      setError('Learning language cannot be the same as your native language');
      setLoading(false);
      return;
    }

    try {
      sendGAEvent('event', 'sign_up', { method: 'email', source_lang: formData.source_lang, target_lang: formData.target_lang });
      await fetchApi('/users/create', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      // Optionally login immediately or redirect
      const loginData = await fetchApi('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      localStorage.setItem('token', loginData.token);
      if (loginData.source_lang) {
        setLang(loginData.source_lang);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We couldn't create your account. Please try again in a moment!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            {t('register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('register.has_account')}{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.login')}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('register.first_name')}</label>
              <input
                type="text"
                name="first_name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('register.last_name')}</label>
              <input
                type="text"
                name="last_name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('register.email')}</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('register.password')}</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={formData.password}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">{t('register.password_hint')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.interface_lang')}</label>
              <select
                name="source_lang"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={formData.source_lang}
                onChange={handleChange}
              >
                {languages.source?.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.learning_lang')}</label>
              <select
                name="target_lang"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={formData.target_lang}
                onChange={handleChange}
              >
                {languages.target?.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 font-medium">{error}</div>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {loading ? t('register.signing_up') : t('register.sign_up')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
