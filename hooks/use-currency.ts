import { useSettings } from "@/lib/settings-context"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

export function useCurrency() {
    const { settings } = useSettings()
    const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({
        CZK: 1,
        EUR: 0.041,
        USD: 0.044,
        GBP: 0.035,
    })
    const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function fetchRates() {
            try {
                // Call our API with auth to avoid 401
                const data = await api.getExchangeRates()
                if (mounted) {
                    if (data.rates) setCurrencyRates(data.rates)
                    if (data.last_updated) setLastRefreshed(data.last_updated)
                }
            } catch (error) {
                console.warn("Using fallback currency rates")
            }
        }
        fetchRates()
        return () => { mounted = false }
    }, [])

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

    return { convert, convertToBase, currency: settings.currency, currencyRates, lastRefreshed }
}
