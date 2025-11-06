"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "./translations"

export interface Settings {
  language: Language
  currency: string
  dateFormat: string
  timeFormat: string
  hotelName: string
}

const defaultSettings: Settings = {
  language: "en",
  currency: "CZK",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  hotelName: "",
}

const currencyRates: Record<string, number> = {
  CZK: 1,
  EUR: 0.041,
  USD: 0.044,
  GBP: 0.035,
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  formatDate: (date: string | Date) => string
  formatCurrency: (amount: number, fromCurrency?: string) => string
  t: (key: TranslationKey) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("minihotel-settings")
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse settings:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("minihotel-settings", JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    switch (settings.dateFormat) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`
      default:
        return `${day}/${month}/${year}`
    }
  }

  const formatCurrency = (amount: number, fromCurrency = "CZK") => {
    // Convert from source currency to target currency
    const amountInCZK = amount / (currencyRates[fromCurrency] || 1)
    const convertedAmount = amountInCZK * (currencyRates[settings.currency] || 1)

    const formatted = convertedAmount.toLocaleString(settings.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    switch (settings.currency) {
      case "USD":
        return `$${formatted}`
      case "EUR":
        return `€${formatted}`
      case "CZK":
        return `${formatted} Kč`
      case "GBP":
        return `£${formatted}`
      default:
        return `${formatted} ${settings.currency}`
    }
  }

  const t = (key: TranslationKey): string => {
    return translations[settings.language]?.[key] || translations.en[key] || key
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatDate, formatCurrency, t }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
