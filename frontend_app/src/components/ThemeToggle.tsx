"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Избегаем несоответствия при гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title="Light theme"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title="Dark theme"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title="System theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
