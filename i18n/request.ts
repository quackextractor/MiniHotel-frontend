import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { getLocales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Get available locales dynamically
    const availableLocales = getLocales().map(l => l.code);
    const isValidLocale = availableLocales.includes(locale as any);

    // Ensure that a valid locale is used
    if (!locale || !isValidLocale) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
