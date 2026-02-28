"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  User,
  Mail,
  Phone,
  CreditCard,
  Trash2,
  Edit2,
  Save,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useCurrency } from "@/hooks/use-currency"
import { useDateFormat } from "@/hooks/use-custom-format"
import { useLocale, useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Booking {
  id: number
  booking_id: string // Although the API returns string, sometimes we treat it as generic ID. Let's match API response.
  guest_id: number
  room_id: number
  check_in: string
  check_out: string
  number_of_guests: number
  status: string
  payment_status?: string
  total_amount?: number
  notes?: string
  guest?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  room?: {
    room_number: string
    room_type: string
  }
}

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-500/20 border-blue-500 text-blue-500",
  pending: "bg-yellow-500/20 border-yellow-500 text-yellow-500",
  "pending payment": "bg-yellow-500/20 border-yellow-500 text-yellow-500",
  "checked-in": "bg-green-500/20 border-green-500 text-green-500",
  "checked-out": "bg-gray-500/20 border-gray-500 text-gray-500",
  draft: "bg-gray-400/10 border-dashed border-gray-400 text-gray-500",
}

export default function CalendarPage() {
  const { formatDate } = useDateFormat()
  const { convert, currency } = useCurrency()
  const locale = useLocale()
  const t = useTranslations("Calendar")
  const tBookings = useTranslations("Bookings")
  const tCommon = useTranslations("Common")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Booking>>({})

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

  const handleEditChange = (field: keyof Booking | "room_id", value: any) => {
    setEditFormData({ ...editFormData, [field]: value })
  }

  const handleSaveEdit = async () => {
    if (!selectedBooking) return
    try {
      console.log("[v0] Saving booking edits...")

      const payload: any = {
        check_in: editFormData.check_in,
        check_out: editFormData.check_out,
        number_of_guests: Number(editFormData.number_of_guests),
        room_id: Number(editFormData.room_id),
        notes: editFormData.notes
      }

      const checkInDate = new Date(payload.check_in || selectedBooking.check_in)
      const checkOutDate = new Date(payload.check_out || selectedBooking.check_out)

      if (checkOutDate <= checkInDate) {
        toast.error("Check-out date must be after check-in date")
        return
      }

      const guests = payload.number_of_guests !== undefined && !isNaN(payload.number_of_guests) ? payload.number_of_guests : selectedBooking.number_of_guests
      if (guests < 1) {
        toast.error("Number of guests must be at least 1")
        return
      }

      await api.updateBooking(selectedBooking.id, payload)
      const updatedBookings = await api.getBookings()
      setBookings(Array.isArray(updatedBookings) ? updatedBookings : updatedBookings.items || [])

      const updatedBooking = (Array.isArray(updatedBookings) ? updatedBookings : updatedBookings.items || []).find((b: Booking) => b.id === selectedBooking.id)
      if (updatedBooking) {
        setSelectedBooking(updatedBooking)
      }
      setIsEditing(false)
      toast.success("Booking updated successfully")
    } catch (err) {
      console.error("[v0] Error updating booking:", err)
      toast.error("Failed to update booking: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const getBookingForRoomAndDate = (roomId: number, date: Date) => {
    return bookings.find(
      (booking) => booking.room_id === roomId && isDateInRange(date, booking.check_in, booking.check_out),
    )
  }

  const isCheckInDate = (booking: Booking, date: Date) => {
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

  const handleStatusChange = async (bookingId: number, newStatus: string, paymentStatus?: string) => {
    try {
      console.log("[v0] Updating booking status...")
      const updateData: any = { status: newStatus }
      if (paymentStatus) updateData.payment_status = paymentStatus

      await api.updateBookingStatus(bookingId, updateData)
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: newStatus, ...(paymentStatus && { payment_status: paymentStatus }) }
            : booking,
        ),
      )
      // Update selected booking as well if it's open
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus, ...(paymentStatus && { payment_status: paymentStatus }) })
      }
    } catch (err) {
      console.error("[v0] Error updating booking status:", err)
      toast.error("Failed to update status: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm(tBookings("deleteConfirmation"))) return

    try {
      console.log("[v0] Deleting booking...", bookingId)
      await api.deleteBooking(bookingId)
      setBookings(bookings.filter((b) => b.id !== bookingId))
      setSelectedBooking(null)
      setIsEditing(false)
      toast.success("Booking deleted successfully")
    } catch (err) {
      console.error("[v0] Error deleting booking:", err)
      toast.error("Failed to delete booking: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t("errorLoading")}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("checkServer")}
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
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            <CalendarIcon className="mr-2 size-4" />
            {t("today")}
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
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 border-b border-border pb-2">
                <div className="font-semibold">{t("room")}</div>
                {weekDates.map((date, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-semibold">{formatDayDate(date)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-2">
                {rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-8 gap-2">
                    <div className="flex items-center font-medium">{t("room")} {room.room_number}</div>
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
                            booking ? "cursor-pointer hover:opacity-80" : ""
                          )}
                          onClick={() => {
                            if (booking) {
                              setSelectedBooking(booking)
                              setIsEditing(false)
                            }
                          }}
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
              <span className="text-sm">{t("legend.checkedIn")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-blue-500 bg-blue-500/20" />
              <span className="text-sm">{t("legend.confirmed")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-yellow-500 bg-yellow-500/20" />
              <span className="text-sm">{t("legend.pending")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-border bg-muted/30" />
              <span className="text-sm">{t("legend.available")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border-dashed border-gray-400 bg-gray-400/10" />
              <span className="text-sm">{t("legend.draft")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingCheckins")}</CardTitle>
          <CardDescription>{t("guestsArriving")}</CardDescription>
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
                    className="cursor-pointer flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedBooking(booking)
                      setIsEditing(false)
                    }}
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
                          {t("room")} {booking.room?.room_number} • {new Date(booking.check_in).toLocaleDateString()}
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

      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{tBookings("bookingDetailsTitle", { id: selectedBooking.id })}</DialogTitle>
              <DialogDescription>{tBookings("bookingDetailsDescription")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{tBookings("guestInformation")}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span>
                        {selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}
                      </span>
                    </div>
                    {selectedBooking.guest?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" />
                        <span className="text-sm">{selectedBooking.guest.email}</span>
                      </div>
                    )}
                    {selectedBooking.guest?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground" />
                        <span className="text-sm">{selectedBooking.guest.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{tBookings("roomDetails")}</Label>
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Label className="self-center w-24">{tBookings("form.room")}</Label>
                          <Select
                            value={editFormData.room_id ? editFormData.room_id.toString() : ""}
                            onValueChange={(value) => handleEditChange("room_id", Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={tBookings("form.selectRoom")} />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  Room {room.room_number} - {room.room_type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Label className="self-center w-24">{tBookings("form.numberOfGuests")}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editFormData.number_of_guests || ""}
                            onChange={(e) => handleEditChange("number_of_guests", e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>
                          <span className="font-medium">{tBookings("form.room")}:</span> {selectedBooking.room?.room_number}
                        </p>
                        <p>
                          <span className="font-medium">{tBookings("form.type")}:</span> {selectedBooking.room?.room_type}
                        </p>
                        <p>
                          <span className="font-medium">{tBookings("form.numberOfGuests")}:</span> {selectedBooking.number_of_guests}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{tBookings("stayDuration")}</Label>
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Label className="self-center w-24">{tBookings("form.checkInDate")}</Label>
                          <Input
                            type="date"
                            value={editFormData.check_in ? editFormData.check_in.substring(0, 10) : ""}
                            onChange={(e) => handleEditChange("check_in", e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Label className="self-center w-24">{tBookings("form.checkOutDate")}</Label>
                          <Input
                            type="date"
                            value={editFormData.check_out ? editFormData.check_out.substring(0, 10) : ""}
                            onChange={(e) => handleEditChange("check_out", e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>
                          <span className="font-medium">{tBookings("form.checkInDate")}:</span>{" "}
                          {new Date(selectedBooking.check_in).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">{tBookings("form.checkOutDate")}:</span>{" "}
                          {new Date(selectedBooking.check_out).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{tBookings("payment")}</Label>
                  <div className="space-y-2">
                    {selectedBooking.total_amount && (
                      <p>
                        <span className="font-medium">{tBookings("total")}:</span> {convert(selectedBooking.total_amount).toFixed(2)} {currency}
                      </p>
                    )}
                    {selectedBooking.payment_status && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-4 text-muted-foreground" />
                        <Badge
                          variant="outline"
                          className={
                            selectedBooking.payment_status === "paid"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }
                        >
                          {selectedBooking.payment_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {isEditing || selectedBooking.notes ? (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{tBookings("notes")}</Label>
                  {isEditing ? (
                    <Textarea
                      value={editFormData.notes || ""}
                      onChange={(e) => handleEditChange("notes", e.target.value)}
                      placeholder={tBookings("form.specialRequests")}
                    />
                  ) : (
                    <p className="text-sm">{selectedBooking.notes}</p>
                  )}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>{tBookings("updateStatus")}</Label>
                <div className="grid gap-2">
                  <Select
                    value={selectedBooking.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedBooking.id, value, selectedBooking.payment_status)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{tBookings("status.pending")}</SelectItem>
                      <SelectItem value="confirmed">{tBookings("status.confirmed")}</SelectItem>
                      <SelectItem value="checked-in">{tBookings("status.checkedIn")}</SelectItem>
                      <SelectItem value="checked-out">{tBookings("status.checkedOut")}</SelectItem>
                      <SelectItem value="cancelled">{tBookings("status.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedBooking.payment_status || "pending"}
                    onValueChange={(value) => {
                      handleStatusChange(selectedBooking.id, selectedBooking.status, value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tBookings("form.selectPaymentStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{tBookings("paymentStatus.pending")}</SelectItem>
                      <SelectItem value="paid">{tBookings("paymentStatus.paid")}</SelectItem>
                      <SelectItem value="partial">{tBookings("paymentStatus.partial")}</SelectItem>
                      <SelectItem value="refunded">{tBookings("paymentStatus.refunded")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex justify-between sm:justify-between w-full">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  {tBookings("deleteBooking")}
                </Button>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="mr-2 size-4" />
                      {tCommon("cancel")}
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      <Save className="mr-2 size-4" />
                      {tCommon("save")}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => {
                    setEditFormData(selectedBooking)
                    setIsEditing(true)
                  }}>
                    <Edit2 className="mr-2 size-4" />
                    {tCommon("edit")}
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
