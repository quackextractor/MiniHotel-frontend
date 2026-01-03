import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SettingsProvider } from "@/lib/settings-context"
import { AuthProvider } from "@/contexts/AuthContext"
import { AutoLogoutManager } from "@/components/auto-logout-manager"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Minihotel Management System",
  description: "Professional hotel management system for bookings, rooms, and operations",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <AutoLogoutManager />
            {children}
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
