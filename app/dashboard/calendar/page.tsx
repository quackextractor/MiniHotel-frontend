"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface CalendarBooking {
  id: number
  room_id: number
  guest_id: number
  check_in: string
  check_out: string
  status: string
  guest?: {
    first_name: string
    last_name: string
  }
  room?: {
    room_number: string
  }
}

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-500/20 border-blue-500 text-blue-500",
  pending: "bg-yellow-500/20 border-yellow-500 text-yellow-500",
  "pending payment": "bg-yellow-500/20 border-yellow-500 text-yellow-500",
  "checked-in": "bg-green-500/20 border-green-500 text-green-500",
  "checked-out": "bg-gray-500/20 border-gray-500 text-gray-500",
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        setLoading(true)
        console.log("[v0] Fetching calendar data from API...")
        const [bookingsData, roomsData] = await Promise.all([api.getBookings(), api.getRooms()])
        console.log("[v0] Calendar data received:", { bookingsData, roomsData })
        setBookings(bookingsData)
        setRooms(roomsData)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching calendar data:", err)
        setError(err instanceof Error ? err.message : "Failed to load calendar")
      } finally {
        setLoading(false)
      }
    }

    fetchCalendarData()
  }, [])

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(currentDate)

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isDateInRange = (date: Date, checkIn: string, checkOut: string) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const checkInOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
    const checkOutOnly = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate())
    return dateOnly >= checkInOnly && dateOnly < checkOutOnly
  }

  const getBookingForRoomAndDate = (roomId: number, date: Date) => {
    return bookings.find(
      (booking) => booking.room_id === roomId && isDateInRange(date, booking.check_in, booking.check_out),
    )
  }

  const isCheckInDate = (booking: CalendarBooking, date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const checkInDate = new Date(booking.check_in)
    const checkInOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
    return dateOnly.getTime() === checkInOnly.getTime()
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const formatDayDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Calendar</CardTitle>
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

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar View</h1>
          <p className="text-muted-foreground">Weekly overview of room bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            <CalendarIcon className="mr-2 size-4" />
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formatMonthYear(currentDate)}</CardTitle>
          <CardDescription>Room availability and bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 border-b border-border pb-2">
                <div className="font-semibold">Room</div>
                {weekDates.map((date, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-semibold">{formatDayDate(date)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-2">
                {rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-8 gap-2">
                    <div className="flex items-center font-medium">Room {room.room_number}</div>
                    {weekDates.map((date, dateIndex) => {
                      const booking = getBookingForRoomAndDate(room.id, date)
                      const isCheckIn = booking && isCheckInDate(booking, date)
                      const statusKey = booking?.status.toLowerCase() || ""

                      return (
                        <div
                          key={dateIndex}
                          className={cn(
                            "min-h-[60px] rounded-md border border-border p-2 transition-colors",
                            booking ? statusColors[statusKey] || statusColors.pending : "bg-muted/30 hover:bg-muted/50",
                          )}
                        >
                          {booking && isCheckIn && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold leading-none">
                                {booking.guest?.first_name} {booking.guest?.last_name}
                              </p>
                              <Badge variant="outline" className="h-4 text-[10px] px-1">
                                {booking.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-6 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-green-500 bg-green-500/20" />
              <span className="text-sm">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-blue-500 bg-blue-500/20" />
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-yellow-500 bg-yellow-500/20" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-border bg-muted/30" />
              <span className="text-sm">Available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Check-ins</CardTitle>
          <CardDescription>Guests arriving this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings
              .filter((booking) => {
                const checkInDate = new Date(booking.check_in)
                return weekDates.some(
                  (date) => date.getDate() === checkInDate.getDate() && date.getMonth() === checkInDate.getMonth(),
                )
              })
              .map((booking) => {
                const statusKey = booking.status.toLowerCase()
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <CalendarIcon className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {booking.guest?.first_name} {booking.guest?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Room {booking.room?.room_number} • {new Date(booking.check_in).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[statusKey] || statusColors.pending}>
                      {booking.status}
                    </Badge>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
