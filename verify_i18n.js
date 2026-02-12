const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const requiredLanguages = ['cs', 'de'];
const baseLanguage = 'en';

function flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
            keys = keys.concat(flattenKeys(value, newKey));
        } else {
            keys.push(newKey);
        }
    }
    return keys;
}

function loadJson(locale) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error(`Error reading ${locale}.json:`, e.message);
        return null;
    }
}

function verify() {
    console.log('Starting i18n verification...');

    const enMessages = loadJson(baseLanguage);
    if (!enMessages) {
        console.error('CRITICAL: Could not load base English messages.');
        process.exit(1);
    }

    const enKeys = new Set(flattenKeys(enMessages));
    let hasErrors = false;

    requiredLanguages.forEach(locale => {
        const messages = loadJson(locale);
        if (!messages) {
            console.error(`Error: Could not load ${locale} messages.`);
            hasErrors = true;
            return;
        }

        const keys = new Set(flattenKeys(messages));
        const missingKeys = [...enKeys].filter(x => !keys.has(x));
        const extraKeys = [...keys].filter(x => !enKeys.has(x));

        if (missingKeys.length > 0) {
            console.error(`\n[${locale}] MISSING ${missingKeys.length} keys:`);
            missingKeys.forEach(k => console.error(`  - ${k}`));
            hasErrors = true;
        }

        if (extraKeys.length > 0) {
            console.warn(`\n[${locale}] WARNING: ${extraKeys.length} extra keys (not in en):`);
            extraKeys.forEach(k => console.warn(`  - ${k}`));
        }

        if (missingKeys.length === 0 && extraKeys.length === 0) {
            console.log(`[${locale}] OK`);
        }
    });

    if (hasErrors) {
        console.error('\nVerification FAILED.');
        process.exit(1);
    } else {
        console.log('\nVerification PASSED.');
    }
}

verify();
