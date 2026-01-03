"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Define the shape of the user object
interface User {
    id: number
    username: string
}

// Define the shape of the context
interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, username: string, userId: number) => void
    logout: () => void
    isAuthenticated: boolean
    loading: boolean
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create the provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for token in localStorage on mount
        const storedToken = localStorage.getItem('token')
        const storedUsername = localStorage.getItem('username')
        const storedUserId = localStorage.getItem('userId')

        if (storedToken && storedUsername && storedUserId) {
            setToken(storedToken)
            setUser({ id: parseInt(storedUserId), username: storedUsername })
        }
        setLoading(false)
    }, [])

    const login = (newToken: string, newUsername: string, newUserId: number) => {
        localStorage.setItem('token', newToken)
        localStorage.setItem('username', newUsername)
        localStorage.setItem('userId', newUserId.toString())
        setToken(newToken)
        setUser({ id: newUserId, username: newUsername })
        router.push('/')
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        localStorage.removeItem('userId')
        setToken(null)
        setUser(null)
        router.push('/login')
    }

    const isAuthenticated = !!token

    // Protected routes logic handled here or in middleware.
    // We'll use this context to conditionally render or redirect as a fail-safe.
    useEffect(() => {
        if (!loading && !isAuthenticated && pathname !== '/login' && pathname !== '/register') {
            router.push('/login')
        }
    }, [loading, isAuthenticated, pathname, router])

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
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
