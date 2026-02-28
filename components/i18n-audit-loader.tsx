import { I18nAudit } from "./i18n-audit"
import fs from "fs"
import path from "path"

// Helper to flatten keys (same as in script)
function flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = []
    for (const key in obj) {
        const value = obj[key]
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null) {
            keys = keys.concat(flattenKeys(value, newKey))
        } else {
            keys.push(newKey)
        }
    }
    return keys
}

export function I18nAuditLoader() {
    // Only run in development
    if (process.env.NODE_ENV !== "development") {
        return null
    }

    try {
        const messagesDir = path.join(process.cwd(), "messages")

        if (!fs.existsSync(messagesDir)) {
            return null
        }

        const files = fs.readdirSync(messagesDir).filter((file) => file.endsWith('.json'))
        const allMessages: Record<string, string[]> = {}
        const allUniqueKeys = new Set<string>()

        for (const file of files) {
            const locale = file.replace('.json', '')
            const content = fs.readFileSync(path.join(messagesDir, file), "utf8")
            const messages = JSON.parse(content)
            const keys = flattenKeys(messages)
            allMessages[locale] = keys
            keys.forEach(k => allUniqueKeys.add(k))
        }

        const missingTranslations = []

        for (const locale in allMessages) {
            const localeKeys = new Set(allMessages[locale])
            const missing = Array.from(allUniqueKeys).filter(k => !localeKeys.has(k))

            if (missing.length > 0) {
                missingTranslations.push({
                    locale,
                    missingKeys: missing
                })
            }
        }

        return <I18nAudit missingTranslations={missingTranslations} />

    } catch (e) {
        console.error("I18n Audit Error:", e)
        return null
    }
}
