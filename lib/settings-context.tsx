"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
// translations import removed

export interface Settings {
  language: string // simple string now, was Language
  currency: string
  dateFormat: string
  timeFormat: string
  hotelName: string
  autoLogoutEnabled: boolean
  autoLogoutTimeout: number // in minutes
}

const defaultSettings: Settings = {
  language: "en",
  currency: "CZK",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  hotelName: "",
  autoLogoutEnabled: false,
  autoLogoutTimeout: 30, // 30 minutes
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
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
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
