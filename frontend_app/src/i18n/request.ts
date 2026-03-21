import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Получаем текущую локаль
  let locale = await requestLocale;

  // Проверяем, что локаль поддерживается, иначе используем дефолтную
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Загружаем JSON файл с переводами (все хранятся в src/locales/)
  // Примечание: next-intl ожидает сообщения как plain objects
  try {
    return {
      locale,
      messages: (await import(`../locales/${locale}.json`)).default
    };
  } catch (error) {
    // Если файла для конкретной локали нет (у нас только ru, en, uk), 
    // пробуем загрузить дефолтную английскую
    console.warn(`Translation for locale ${locale} not found, falling back to en.`);
    return {
      locale,
      messages: (await import(`../locales/en.json`)).default
    };
  }
});
