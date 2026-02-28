"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'

// Define the shape of the user object
interface User {
    id: number
    username: string
}

// Define the shape of the context
interface AuthContextType {
    user: User | null
    login: (username: string, userId: number) => void
    logout: (reason?: string) => void
    isAuthenticated: boolean
    loading: boolean
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create the provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for token in localStorage on mount
        const storedUsername = localStorage.getItem('username')
        const storedUserId = localStorage.getItem('userId')

        if (storedUsername && storedUserId) {
            setUser({ id: parseInt(storedUserId), username: storedUsername })
        }
        setLoading(false)
    }, [])

    const login = (newUsername: string, newUserId: number) => {
        localStorage.setItem('username', newUsername)
        localStorage.setItem('userId', newUserId.toString())
        setUser({ id: newUserId, username: newUsername })
        router.push('/')
    }

    const logout = async (reason?: string) => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch (e) {
            console.error("Failed to logout remotely", e)
        }
        localStorage.removeItem('username')
        localStorage.removeItem('userId')
        setUser(null)
        if (reason) {
            router.push(`/login?error=${encodeURIComponent(reason)}`)
        } else {
            router.push('/login')
        }
    }

    const isAuthenticated = !!user

    // Protected routes logic handled here or in middleware.
    // We'll use this context to conditionally render or redirect as a fail-safe.
    useEffect(() => {
        if (!loading && !isAuthenticated && pathname !== '/login' && pathname !== '/register') {
            router.push('/login')
        }
    }, [loading, isAuthenticated, pathname, router])

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook to use the context
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
