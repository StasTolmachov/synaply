import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Настраиваем мэтчинг маршрутов для которых будет работать middleware
  // Нам нужно обрабатывать всё, кроме статики (_next, api, favicon, images и т.д.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*|manifest.json).*)', '/']
};
