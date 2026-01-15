import { useSettings } from "@/lib/settings-context"
import { useFormatter } from "next-intl"

export function useDateFormat() {
    const { settings } = useSettings()
    const format = useFormatter()

    const formatDate = (date: Date | string | number) => {
        const d = new Date(date)

        // Map our settings format to Intl.DateTimeFormatOptions if possible, 
        // or manually format if strictly following the string pattern is needed.
        // For simplicity and localization power, we try to use standard Intl options where possible,
        // but the requirement is specific patterns. 

        // However, since we want specific patterns like DD/MM/YYYY vs YYYY-MM-DD that might not strictly align with locales,
        // we can do a simple manual format or use a library. 
        // Given we are using next-intl, let's try to use it, but it relies on skeleton formats.

        // Standard approach without extra heavy libs like date-fns (unless already present?):
        // We can do simple string manipulation for these common formats.

        const day = d.getDate().toString().padStart(2, '0')
        const month = (d.getMonth() + 1).toString().padStart(2, '0')
        const year = d.getFullYear()

        switch (settings.dateFormat) {
            case "DD/MM/YYYY":
                return `${day}/${month}/${year}`
            case "MM/DD/YYYY":
                return `${month}/${day}/${year}`
            case "YYYY-MM-DD":
                return `${year}-${month}-${day}`
            default:
                return format.dateTime(d, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                })
        }
    }

    const formatTime = (date: Date | string | number) => {
        const d = new Date(date)
        if (settings.timeFormat === '24h') {
            return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
        } else {
            return d.toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: '2-digit' })
        }
    }

    return { formatDate, formatTime }
}
