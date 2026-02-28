import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { getLocales, validateTranslations } from './config';

validateTranslations();

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
        messages: (await import(`../messages/${locale}.json`)).default,
        onError(error) {
            if (error.code === 'MISSING_MESSAGE') {
                console.warn(`Missing translation: ${error.message}`);
            } else {
                console.error(error);
            }
        },
        getMessageFallback({ namespace, key, error }) {
            const path = [namespace, key].filter((part) => part != null).join('.');
            if (error.code === 'MISSING_MESSAGE') {
                console.warn(`Missing translation for key: '${path}' in locale: '${locale}'`);
            }
            return path;
        }
    };
});
