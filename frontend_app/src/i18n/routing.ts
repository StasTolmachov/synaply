import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { languages } from '../lib/languages';

export const routing = defineRouting({
  // Список всех поддерживаемых локалей из languages.ts (в нижнем регистре)
  locales: Object.keys(languages).map(lang => lang.toLowerCase()),
  
  // Дефолтная локаль, если не удалось определить
  defaultLocale: 'en',
  
  // Автоматический редирект на подпапку локали (например, /dashboard -> /en/dashboard)
  localePrefix: 'always'
});

// Обертки для навигации, которые автоматически добавляют локаль в URL
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
