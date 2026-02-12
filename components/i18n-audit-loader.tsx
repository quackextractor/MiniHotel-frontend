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
        const enContent = fs.readFileSync(path.join(messagesDir, "en.json"), "utf8")
        const enMessages = JSON.parse(enContent)
        const enKeys = new Set(flattenKeys(enMessages))

        const requiredLanguages = ["cs", "de"]
        const missingTranslations = []

        for (const locale of requiredLanguages) {
            try {
                const content = fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8")
                const messages = JSON.parse(content)
                const keys = new Set(flattenKeys(messages))

                const missing = [...enKeys].filter(x => !keys.has(x))
                if (missing.length > 0) {
                    missingTranslations.push({
                        locale,
                        missingKeys: missing
                    })
                }
            } catch (e) {
                console.error(`Error loading locale ${locale}:`, e)
                missingTranslations.push({
                    locale,
                    missingKeys: ["Could not load file (syntax error or missing)"]
                })
            }
        }

        return <I18nAudit missingTranslations={missingTranslations} />

    } catch (e) {
        console.error("I18n Audit Error:", e)
        return null
    }
}
