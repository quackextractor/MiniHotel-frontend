"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Plus,
  Search,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Trash2,
  Check,
  ChevronsUpDown,
  Edit2,
  Save,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useEnterNavigation } from "@/hooks/use-enter-navigation"
import { useCurrency } from "@/hooks/use-currency"
import { useDateFormat } from "@/hooks/use-custom-format"
import { useTranslations } from "next-intl"

import { Booking } from "@/lib/types"
import { BookingForm } from "@/components/booking-form"

const statusConfig: Record<string, { color: string; icon: any }> = {
  confirmed: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle },
  pending: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  "pending payment": { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  "checked-in": { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  "checked-out": { color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: CheckCircle },
  cancelled: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  draft: { color: "bg-gray-400/10 text-gray-400 border-dashed border-gray-400/50", icon: Clock },
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const formRef = useEnterNavigation()

  const { convert, convertToBase, currency } = useCurrency()
  const { formatDate } = useDateFormat()
  const t = useTranslations("Bookings")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        console.log("[v0] Fetching bookings, rooms, guests, and services from API...")
        const [bookingsData, roomsData, guestsData, servicesData] = await Promise.all([
          api.getBookings(),
          api.getRooms(),
          api.getGuests(),
          api.getServices(),
        ])
        console.log("[v0] Data received:", { bookingsData, roomsData, guestsData, servicesData })
        setBookings(bookingsData || [])
        setRooms(roomsData)
        setGuests(guestsData)
        setServices(servicesData)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEditBookingSubmit = async (bookingData: any) => {
    if (!selectedBooking) return
    try {
      console.log("[v0] Saving booking edits...")
      await api.updateBooking(selectedBooking.id, bookingData)
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

  const handleCreateBookingSubmit = async (bookingData: any) => {
    try {
      console.log("[v0] Creating new booking...")
      const newBooking = await api.createBooking(bookingData)
      console.log("[v0] Booking created:", newBooking)
      setBookings([...bookings, newBooking])
      setIsAddDialogOpen(false)
      setShowGuestForm(false)
      toast.success("Booking created successfully!")
    } catch (err) {
      console.error("[v0] Error creating booking:", err)
      toast.error("Failed to create booking: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const handleCreateGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      console.log("[v0] Creating new guest...")
      const newGuest = await api.createGuest({
        first_name: formData.get("firstName") as string,
        last_name: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
      })
      console.log("[v0] Guest created:", newGuest)
      setGuests([...guests, newGuest])
      setShowGuestForm(false)
      toast.success("Guest created successfully!")
    } catch (err) {
      console.error("[v0] Error creating guest:", err)
      toast.error("Failed to create guest: " + (err instanceof Error ? err.message : "Unknown error"))
    }
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
    } catch (err) {
      console.error("[v0] Error updating booking status:", err)
      toast.error("Failed to update status: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) return

    try {
      console.log("[v0] Deleting booking...", bookingId)
      await api.deleteBooking(bookingId)
      setBookings(bookings.filter((b) => b.id !== bookingId))
      setSelectedBooking(null)
      toast.success("Booking deleted successfully")
    } catch (err) {
      console.error("[v0] Error deleting booking:", err)
      toast.error("Failed to delete booking: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const filteredBookings = (status?: string) => {
    return bookings.filter((booking) => {
      const guestName = booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : ""
      const matchesSearch =
        guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toString().includes(searchQuery) ||
        (booking.room?.room_number || "").includes(searchQuery)
      const matchesStatus = !status || booking.status.toLowerCase() === status.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <h3 className="text-lg font-semibold">Error Loading Bookings</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              {t("newBooking")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {showGuestForm ? (
              <form ref={formRef} onSubmit={handleCreateGuest}>
                <DialogHeader>
                  <DialogTitle>{t("createGuestTitle")}</DialogTitle>
                  <DialogDescription>{t("createGuestDescription")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">{t("form.firstName")} *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">{t("form.lastName")} *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="email">{t("form.email")}</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">{t("form.phone")}</Label>
                      <Input id="phone" name="phone" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">{t("form.address")}</Label>
                    <Textarea id="address" name="address" />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowGuestForm(false)}>
                    {t("backToBooking")}
                  </Button>
                  <Button type="submit">{t("createGuest")}</Button>
                </DialogFooter>
              </form>
            ) : (
              <BookingForm
                rooms={rooms}
                guests={guests}
                services={services}
                onSubmit={handleCreateBookingSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
                onGuestCreateClick={() => setShowGuestForm(true)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div >

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="all" className="flex-1">
        <TabsList>
          <TabsTrigger value="all">{t("allBookings")}</TabsTrigger>
          <TabsTrigger value="pending">{t("status.pending")}</TabsTrigger>
          <TabsTrigger value="confirmed">{t("status.confirmed")}</TabsTrigger>
          <TabsTrigger value="checked-in">{t("status.checkedIn")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <BookingsList
            bookings={filteredBookings()}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <BookingsList
            bookings={filteredBookings("pending")}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <BookingsList
            bookings={filteredBookings("confirmed")}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>

        <TabsContent value="checked-in" className="space-y-4">
          <BookingsList
            bookings={filteredBookings("checked-in")}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>
      </Tabs>

      {
        selectedBooking && (
          <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? `Edit Booking #${selectedBooking.id}` : t("bookingDetailsTitle", { id: selectedBooking.id })}</DialogTitle>
                <DialogDescription>{isEditing ? "Update booking details below." : t("bookingDetailsDescription")}</DialogDescription>
              </DialogHeader>
              {isEditing ? (
                <BookingForm
                  initialData={selectedBooking}
                  rooms={rooms}
                  guests={guests}
                  services={services}
                  onSubmit={handleEditBookingSubmit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className="grid gap-6 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("guestInformation")}</Label>
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
                      <Label className="text-muted-foreground">{t("roomDetails")}</Label>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">{t("form.room")}:</span> {selectedBooking.room?.room_number}
                        </p>
                        <p>
                          <span className="font-medium">{t("form.type")}:</span> {selectedBooking.room?.room_type}
                        </p>
                        <p>
                          <span className="font-medium">{t("form.numberOfGuests")}:</span> {selectedBooking.number_of_guests}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("stayDuration")}</Label>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">{t("form.checkInDate")}:</span>{" "}
                          {formatDate(selectedBooking.check_in)}
                        </p>
                        <p>
                          <span className="font-medium">{t("form.checkOutDate")}:</span>{" "}
                          {formatDate(selectedBooking.check_out)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("payment")}</Label>
                      <div className="space-y-2">
                        {selectedBooking.total_amount && (
                          <p>
                            <span className="font-medium">{t("total")}:</span> {convert(selectedBooking.total_amount).toFixed(2)} {currency}
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
                  {selectedBooking.notes ? (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("notes")}</Label>
                      <p className="text-sm">{selectedBooking.notes}</p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label>{t("updateStatus")}</Label>
                    <div className="grid gap-2">
                      <Select
                        value={selectedBooking.status}
                        onValueChange={(value) => {
                          handleStatusChange(selectedBooking.id, value, selectedBooking.payment_status)
                          setSelectedBooking({ ...selectedBooking, status: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("status.pending")}</SelectItem>
                          <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                          <SelectItem value="checked-in">{t("status.checkedIn")}</SelectItem>
                          <SelectItem value="checked-out">{t("status.checkedOut")}</SelectItem>
                          <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedBooking.payment_status || "pending"}
                        onValueChange={(value) => {
                          handleStatusChange(selectedBooking.id, selectedBooking.status, value)
                          setSelectedBooking({ ...selectedBooking, payment_status: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("paymentStatus.pending")}</SelectItem>
                          <SelectItem value="paid">{t("paymentStatus.paid")}</SelectItem>
                          <SelectItem value="partial">{t("paymentStatus.partial")}</SelectItem>
                          <SelectItem value="refunded">{t("paymentStatus.refunded")}</SelectItem>
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
                      {t("deleteBooking")}
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 size-4" />
                      Edit
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  )
}

function BookingsList({
  bookings,
  onStatusChange,
  onSelectBooking,
}: {
  bookings: Booking[]
  onStatusChange: (id: number, status: string, paymentStatus?: string) => void
  onSelectBooking: (booking: Booking) => void
}) {
  const { convert, currency } = useCurrency()
  const { formatDate } = useDateFormat()
  const t = useTranslations("Bookings")
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("noBookingsFound")}</h3>
          <p className="text-sm text-muted-foreground">{t("tryAdjustingSearch")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => {
        const statusKey = booking.status.toLowerCase()
        const config = statusConfig[statusKey] || statusConfig.pending
        const StatusIcon = config.icon
        const guestName = booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : t("form.noGuestFound")

        return (
          <Card
            key={booking.id}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => onSelectBooking(booking)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{guestName}</h3>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="mr-1 size-3" />
                          {t(`status.${statusKey}` as any)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("bookingId")}: #{booking.id}</p>
                    </div>
                    {booking.total_amount && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{convert(booking.total_amount).toFixed(2)} {currency}</p>
                        {booking.payment_status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-1",
                              booking.payment_status === "paid"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500",
                            )}
                          >
                            {t(`paymentStatus.${booking.payment_status}` as any)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t("form.checkInDate")}</p>
                        <p className="text-muted-foreground">{formatDate(booking.check_in)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t("form.checkOutDate")}</p>
                        <p className="text-muted-foreground">{formatDate(booking.check_out)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t("form.room")} {booking.room?.room_number}</p>
                        <p className="text-muted-foreground">{booking.room?.room_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {booking.number_of_guests} {t("form.guest")}{booking.number_of_guests > 1 ? "s" : ""}
                        </p>
                        {booking.guest?.phone && <p className="text-muted-foreground">{booking.guest.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{t("form.notes")}:</span> {booking.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
