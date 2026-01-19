"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DoorOpen, Calendar, Users, TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { useSettings } from "@/lib/settings-context"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslations } from "next-intl"
import { Booking } from "@/lib/types"

interface DashboardStats {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  todayCheckIns: number
  todayCheckOuts: number
  occupancyRate: number
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard")
  const commonT = useTranslations("Common")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      if (authLoading || !isAuthenticated) return

      try {
        setLoading(true)

        const [rooms, bookings] = await Promise.all([api.getRooms(), api.getBookings()])

        const today = new Date().toISOString().split("T")[0]
        const todayCheckIns = bookings.filter((b: Booking) => b.check_in === today).length
        const todayCheckOuts = bookings.filter((b: Booking) => b.check_out === today).length
        const occupiedRooms = bookings.filter((b: Booking) => b.status === "checked-in" || b.status === "confirmed").length

        setStats({
          totalRooms: rooms.length,
          availableRooms: rooms.length - occupiedRooms,
          occupiedRooms,
          todayCheckIns,
          todayCheckOuts,
          occupancyRate: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0,
        })
        setError(null)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated, authLoading])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">{commonT("loading")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{commonT("error")}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Make sure the API server is running at http://127.0.0.1:5000
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: t("totalRooms"),
      value: stats?.totalRooms.toString() || "0",
      description: t("occupancyDescription", { available: stats?.availableRooms, occupied: stats?.occupiedRooms }),
      icon: DoorOpen,
      trend: t("occupancyTrend", { occupied: stats?.occupiedRooms, total: stats?.totalRooms }),
    },
    {
      title: t("todayActivity"),
      value: ((stats?.todayCheckIns || 0) + (stats?.todayCheckOuts || 0)).toString(),
      description: t("activityDescription", { checkIns: stats?.todayCheckIns, checkOuts: stats?.todayCheckOuts }),
      icon: Calendar,
      trend: t("todayActivity"),
    },
    {
      title: t("occupancyRate"),
      value: `${stats?.occupancyRate}%`,
      description: stats?.occupancyRate && stats.occupancyRate > 70 ? t("aboveAverage") : t("belowAverage"),
      icon: TrendingUp,
      trend: t("occupancyTrend", { occupied: stats?.occupiedRooms, total: stats?.totalRooms }),
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="text-muted-foreground">{t("welcomeBack")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
            <CardDescription>{t("latestUpdates")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="size-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">New booking received</p>
                  <p className="text-xs text-muted-foreground">Room 205 - Check-in tomorrow</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <DoorOpen className="size-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Room status updated</p>
                  <p className="text-xs text-muted-foreground">Room 102 - Now available</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Event scheduled</p>
                  <p className="text-xs text-muted-foreground">Conference room - Friday 2PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
            <CardDescription>{t("commonTasks")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <a
                href="/dashboard/bookings?action=new"
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
              >
                <Calendar className="size-4" />
                <span>{t("createNewBooking")}</span>
              </a>
              <a
                href="/dashboard/rooms"
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
              >
                <DoorOpen className="size-4" />
                <span>{t("manageRooms")}</span>
              </a>
              <a
                href="/dashboard/calendar"
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
              >
                <Calendar className="size-4" />
                <span>{t("viewCalendar")}</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
