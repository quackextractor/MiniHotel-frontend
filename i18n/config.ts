import fs from 'fs';
import path from 'path';

export interface LocaleConfig {
    code: string;
    name: string;
    flag?: string;
}

export const getLocales = (): LocaleConfig[] => {
    const messagesDir = path.resolve(process.cwd(), 'messages');
    // Ensure directory exists
    if (!fs.existsSync(messagesDir)) {
        return [{ code: 'en', name: 'English' }];
    }

    const files = fs.readdirSync(messagesDir).filter((file) => file.endsWith('.json'));

    const locales: LocaleConfig[] = [];

    for (const file of files) {
        try {
            const filePath = path.join(messagesDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const json = JSON.parse(fileContent);

            if (json._meta) {
                locales.push({
                    code: json._meta.code,
                    name: json._meta.name,
                    flag: json._meta.flag,
                });
            } else {
                // Fallback if _meta is missing, use filename
                const code = file.replace('.json', '');
                locales.push({
                    code,
                    name: code.toUpperCase(),
                });
            }
        } catch (error) {
            console.error(`Error reading locale file ${file}:`, error);
        }
    }

    // Ensure we have at least English if something goes wrong, or if no valid files found
    if (locales.length === 0) {
        return [{ code: 'en', name: 'English' }];
    }

    return locales;
};

let validationDone = false;

export function validateTranslations() {
    if (validationDone || process.env.NODE_ENV === 'production') return;

    const messagesDir = path.resolve(process.cwd(), 'messages');
    if (!fs.existsSync(messagesDir)) return;

    const files = fs.readdirSync(messagesDir).filter((file) => file.endsWith('.json'));
    const allMessages: Record<string, string[]> = {};
    const allUniqueKeys = new Set<string>();

    function flattenKeys(obj: any, prefix = ''): string[] {
        let keys: string[] = [];
        for (const key in obj) {
            if (key === '_meta') continue;
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                keys = keys.concat(flattenKeys(value, newKey));
            } else {
                keys.push(newKey);
            }
        }
        return keys;
    }

    try {
        for (const file of files) {
            const locale = file.replace('.json', '');
            const filePath = path.join(messagesDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const json = JSON.parse(content);
            const keys = flattenKeys(json);
            allMessages[locale] = keys;
            keys.forEach(k => allUniqueKeys.add(k));
        }

        const errors: string[] = [];
        for (const locale in allMessages) {
            const localeKeys = new Set(allMessages[locale]);
            const missing = Array.from(allUniqueKeys).filter(k => !localeKeys.has(k));
            if (missing.length > 0) {
                errors.push(`[${locale}] is missing: ${missing.join(', ')}`);
            }
        }

        if (errors.length > 0) {
            console.error("Translation Validation Failed! Missing keys globally detected:\n" + errors.join("\n"));
        }
        validationDone = true;
    } catch (e: any) {
        console.error("Error validating translations:", e);
    }
}
