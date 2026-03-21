'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';

interface I18nContextProps {
  lang: string;
  setLang: (lang: string, saveToLocal?: boolean) => void;
  resetToSaved: () => void;
  t: (path: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const tNext = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const resetToSaved = () => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem('source_lang');
    if (savedLang) {
      const lowerSaved = savedLang.toLowerCase();
      // Only redirect if different from current locale AND it's a valid locale
      if (lowerSaved !== locale.toLowerCase()) {
        const isValidLocale = routing.locales.includes(lowerSaved as any);
        if (isValidLocale) {
          // Check where we are actually going
          const currentUrlPath = window.location.pathname;
          
          // If we are already on a specific page (e.g. /dashboard),
          // pathname will be /dashboard.
          // If we are still on root (unmounting landing), pathname is /.
          const targetPath = `/${lowerSaved}${pathname}`;
          
          if (currentUrlPath !== targetPath && currentUrlPath !== `${targetPath}/`) {
            window.location.replace(targetPath);
          }
        }
      }
    }
  };

  const syncLocaleWithSaved = () => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem('source_lang');
    if (savedLang) {
      const lowerSaved = savedLang.toLowerCase();
      // Don't sync on landing page (handled by LandingPage component)
      if (pathname === '/') {
        return;
      }
      
      if (lowerSaved !== locale.toLowerCase()) {
        const isValidLocale = routing.locales.includes(lowerSaved as any);
        if (isValidLocale) {
          // IMPORTANT: Check if we are already on the correct locale in the URL
          // pathname from usePathname() doesn't include locale.
          // window.location.pathname DOES include locale.
          const currentUrlPath = window.location.pathname;
          const targetPath = `/${lowerSaved}${pathname}`;
          
          if (currentUrlPath !== targetPath && currentUrlPath !== `${targetPath}/`) {
             window.location.replace(targetPath);
          }
        }
      }
    }
  };

  // Run sync on mount and when pathname/locale changes
  React.useEffect(() => {
    syncLocaleWithSaved();
  }, [pathname, locale]);

  const setLang = (newLang: string, saveToLocal: boolean = true) => {
    if (typeof window === 'undefined') return;
    const lowerLang = newLang.toLowerCase();
    
    if (saveToLocal) {
      localStorage.setItem('source_lang', lowerLang);
    }

    // Only redirect if different and valid
    if (lowerLang !== locale.toLowerCase()) {
      const isValidLocale = routing.locales.includes(lowerLang as any);
      if (isValidLocale) {
        // Use window.location.replace to avoid triggering router.replace in a loop
        // and to fully reload the page with the new locale if necessary.
        const currentUrlPath = window.location.pathname;
        const targetPath = pathname === '/' ? `/${lowerLang}` : `/${lowerLang}${pathname}`;
        
        if (currentUrlPath !== targetPath && currentUrlPath !== `${targetPath}/`) {
          window.location.replace(targetPath);
        }
      }
    }
  };

  // Адаптер для старого t() метода, чтобы не переписывать все компоненты сразу
  const t = (path: string, params?: Record<string, string>): string => {
    try {
      // next-intl по умолчанию парсит теги <TAG> в строке перевода
      // Если мы хотим вернуть чистый HTML для dangerouslySetInnerHTML,
      // мы должны передать обработчики для тегов, которые просто вернут тег обратно в строку.
      const htmlHandlers: Record<string, (chunks: ReactNode) => string> = {
        strong: (chunks) => `<strong>${chunks}</strong>`,
        b: (chunks) => `<b>${chunks}</b>`,
        i: (chunks) => `<i>${chunks}</i>`,
        br: () => `<br/>`
      };

      // next-intl ожидает, что tNext вернет string, если все переданные значения в params и теги возвращают string
      // В типах next-intl это может быть сложнее, поэтому приводим к any для вызова.
      return (tNext as any)(path, { ...params, ...htmlHandlers });
    } catch (e) {
      // Если ключ не найден, возвращаем сам путь (как и в старой реализации)
      return path;
    }
  };

  return (
    <I18nContext.Provider value={{ lang: locale, setLang, resetToSaved, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
