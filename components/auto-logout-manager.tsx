"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSettings } from "@/lib/settings-context"

export function AutoLogoutManager() {
    const { logout, isAuthenticated } = useAuth()
    const { settings } = useSettings()
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!isAuthenticated || !settings.autoLogoutEnabled) {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            return
        }

        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            // Convert minutes to milliseconds
            const timeoutMs = settings.autoLogoutTimeout * 60 * 1000
            if (timeoutMs > 0) {
                timerRef.current = setTimeout(() => {
                    console.log("Auto-logout triggered due to inactivity")
                    logout('Auto-logout due to inactivity')
                }, timeoutMs)
            }
        }

        // Initial start
        resetTimer()

        // Listeners
        const events = ["mousemove", "keypress", "click", "scroll", "touchstart"]
        events.forEach(event => window.addEventListener(event, resetTimer))

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            events.forEach(event => window.removeEventListener(event, resetTimer))
        }
    }, [isAuthenticated, settings.autoLogoutEnabled, settings.autoLogoutTimeout, logout])

    return null
}
