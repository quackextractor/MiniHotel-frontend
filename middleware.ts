import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getLocales } from './i18n/config';

export default async function middleware(request: any) {
    const locales = getLocales().map((l) => l.code);

    // Create middleware with dynamic locales
    const handleRequest = createMiddleware({
        ...routing,
        locales: locales.length > 0 ? locales : routing.locales
    });

    return handleRequest(request);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
    runtime: 'nodejs'
};
