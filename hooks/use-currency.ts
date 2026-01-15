import { useSettings } from "@/lib/settings-context"

const currencyRates: Record<string, number> = {
    CZK: 1,
    EUR: 0.041,
    USD: 0.044,
    GBP: 0.035,
}

export function useCurrency() {
    const { settings } = useSettings()

    const convert = (amount: number, fromCurrency = "CZK") => {
        const amountInCZK = amount / (currencyRates[fromCurrency] || 1)
        const convertedAmount = amountInCZK * (currencyRates[settings.currency] || 1)
        return convertedAmount
    }

    return { convert, currency: settings.currency }
}
