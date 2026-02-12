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
