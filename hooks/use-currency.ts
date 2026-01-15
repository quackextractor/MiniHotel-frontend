import { useSettings } from "@/lib/settings-context"

const currencyRates: Record<string, number> = {
    CZK: 1,
    EUR: 0.041, // 1/24.4
    USD: 0.044, // 1/22.7
    GBP: 0.035, // 1/28.5
}

export function useCurrency() {
    const { settings } = useSettings()

    const convert = (amount: number, fromCurrency = "CZK") => {
        const amountInCZK = amount / (currencyRates[fromCurrency] || 1)
        const convertedAmount = amountInCZK * (currencyRates[settings.currency] || 1)
        return convertedAmount
    }

    const convertToBase = (amount: number, fromCurrency?: string) => {
        const currency = fromCurrency || settings.currency
        const rate = currencyRates[currency] || 1
        return amount / rate
    }

    return { convert, convertToBase, currency: settings.currency, currencyRates }
}
