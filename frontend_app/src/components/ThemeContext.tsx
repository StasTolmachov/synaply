"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
      // Чтобы избежать моргания при первой загрузке, 
      // блокирующий скрипт в layout.tsx уже мог установить нужный класс.
      // Здесь мы только синхронизируем состояние.
      
      const currentClasses = Array.from(root.classList);
      const hasDark = currentClasses.includes('dark');
      const hasLight = currentClasses.includes('light');

      let themeToApply: 'light' | 'dark';
      if (t === 'system') {
        themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        themeToApply = t as 'light' | 'dark';
      }

      root.style.colorScheme = themeToApply;

      if (themeToApply === 'dark' && !hasDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      } else if (themeToApply === 'light' && !hasLight) {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    applyTheme(theme);

    // Слушаем изменения системной темы, если выбрана 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
