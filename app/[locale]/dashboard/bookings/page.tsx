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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useEnterNavigation } from "@/hooks/use-enter-navigation"
import { useCurrency } from "@/hooks/use-currency"
import { useDateFormat } from "@/hooks/use-custom-format"
import { useTranslations } from "next-intl"

import { Booking } from "@/lib/types"

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
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [calculatedRate, setCalculatedRate] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<string>("")
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
        setBookings(bookingsData.items || [])
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

  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedServices(new Set())
      setCalculatedRate(null)
    }
  }, [isAddDialogOpen])

  const handleAddBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      console.log("[v0] Creating new booking...")
      const bookingData: any = {
        guest_id: Number(formData.get("guestId")),
        room_id: Number(formData.get("roomId")),
        check_in: formData.get("checkIn") as string,
        check_out: formData.get("checkOut") as string,
        number_of_guests: Number(formData.get("numberOfGuests")),
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      }

      const totalAmountInput = formData.get("totalAmount")
      if (totalAmountInput) {
        // Convert the input amount (User Currency) back to Base (CZK)
        bookingData.total_amount = convertToBase(Number(totalAmountInput))
      }

      const paymentStatus = formData.get("paymentStatus")
      if (paymentStatus) bookingData.payment_status = paymentStatus

      const paymentMethod = formData.get("paymentMethod")
      if (paymentMethod) bookingData.payment_method = paymentMethod

      const assignedTo = formData.get("assignedTo")
      if (assignedTo) bookingData.assigned_to = assignedTo

      bookingData.services = Array.from(selectedServices)

      const newBooking = await api.createBooking(bookingData)
      console.log("[v0] Booking created:", newBooking)
      setBookings([...bookings, newBooking])
      setIsAddDialogOpen(false)
      setShowGuestForm(false)
      setCalculatedRate(null)
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

  const handleCalculateRate = async (
    roomId: string,
    checkIn: string,
    checkOut: string,
    numberOfGuests: string,
    currentSelectedServices?: Set<number>
  ) => {
    if (!roomId || !checkIn || !checkOut) return

    const servicesToUse = currentSelectedServices || selectedServices

    try {
      const result = await api.calculateRate({
        room_id: Number(roomId),
        check_in: checkIn,
        check_out: checkOut,
        number_of_guests: numberOfGuests ? Number(numberOfGuests) : undefined,
        service_ids: Array.from(servicesToUse),
      })
      // API returns rate in Base Currency (CZK)
      // We store it as is, but UI will convert it for display
      setCalculatedRate(result.total_amount || result.calculated_rate)
    } catch (err) {
      console.error("[v0] Error calculating rate:", err)
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
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage reservations and guest information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {showGuestForm ? (
              <form ref={formRef} onSubmit={handleCreateGuest}>
                <DialogHeader>
                  <DialogTitle>Create New Guest</DialogTitle>
                  <DialogDescription>Add a new guest to the system</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowGuestForm(false)}>
                    Back to Booking
                  </Button>
                  <Button type="submit">Create Guest</Button>
                </DialogFooter>
              </form>
            ) : (
              <form ref={formRef} onSubmit={handleAddBooking}>
                <DialogHeader>
                  <DialogTitle>Create New Booking</DialogTitle>
                  <DialogDescription>Add a new reservation to the system</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="guestId">Guest *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowGuestForm(true)}>
                        <UserPlus className="mr-2 size-4" />
                        New Guest
                      </Button>
                    </div>


                    <input type="hidden" name="guestId" value={selectedGuestId} />

                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {selectedGuestId
                            ? (() => {
                              const guest = guests.find((g) => g.id.toString() === selectedGuestId)
                              return guest
                                ? `${guest.first_name} ${guest.last_name} ${guest.email ? `(${guest.email})` : ""}`
                                : "Select guest..."
                            })()
                            : "Select guest..."}
                          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search guest..." />
                          <CommandList>
                            <CommandEmpty>No guest found.</CommandEmpty>
                            <CommandGroup>
                              {guests.map((guest) => (
                                <CommandItem
                                  key={guest.id}
                                  value={`${guest.first_name} ${guest.last_name} ${guest.email || ""}`}
                                  onSelect={() => {
                                    setSelectedGuestId(guest.id.toString())
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      selectedGuestId === guest.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {guest.first_name} {guest.last_name} {guest.email && <span className="ml-2 text-muted-foreground">({guest.email})</span>}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="roomId">Room *</Label>
                    <Select
                      name="roomId"
                      required
                      onValueChange={(value) => {
                        const checkIn = (document.getElementById("checkIn") as HTMLInputElement)?.value
                        const checkOut = (document.getElementById("checkOut") as HTMLInputElement)?.value
                        const numberOfGuests = (document.getElementById("numberOfGuests") as HTMLInputElement)?.value
                        if (checkIn && checkOut) {
                          handleCalculateRate(value, checkIn, checkOut, numberOfGuests)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            Room {room.room_number} - {room.room_type} (${room.base_rate}/night, Capacity:{" "}
                            {room.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="checkIn">Check-in Date *</Label>
                      <Input
                        id="checkIn"
                        name="checkIn"
                        type="date"
                        required
                        onChange={(e) => {
                          const roomId = (document.querySelector('[name="roomId"]') as any)?.value
                          const checkOut = (document.getElementById("checkOut") as HTMLInputElement)?.value
                          const numberOfGuests = (document.getElementById("numberOfGuests") as HTMLInputElement)?.value
                          if (roomId && checkOut) {
                            handleCalculateRate(roomId, e.target.value, checkOut, numberOfGuests)
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="checkOut">Check-out Date *</Label>
                      <Input
                        id="checkOut"
                        name="checkOut"
                        type="date"
                        required
                        onChange={(e) => {
                          const roomId = (document.querySelector('[name="roomId"]') as any)?.value
                          const checkIn = (document.getElementById("checkIn") as HTMLInputElement)?.value
                          const numberOfGuests = (document.getElementById("numberOfGuests") as HTMLInputElement)?.value
                          if (roomId && checkIn) {
                            handleCalculateRate(roomId, checkIn, e.target.value, numberOfGuests)
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                      <Input
                        id="numberOfGuests"
                        name="numberOfGuests"
                        type="number"
                        min="1"
                        placeholder="2"
                        required
                        onChange={(e) => {
                          const roomId = (document.querySelector('[name="roomId"]') as any)?.value
                          const checkIn = (document.getElementById("checkIn") as HTMLInputElement)?.value
                          const checkOut = (document.getElementById("checkOut") as HTMLInputElement)?.value
                          if (roomId && checkIn && checkOut) {
                            handleCalculateRate(roomId, checkIn, checkOut, e.target.value)
                          }
                        }}
                      />
                    </div>
                  </div>



                  <div className="grid gap-2">
                    <Label>Select Services (Optional)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-4 max-h-[150px] overflow-y-auto">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={selectedServices.has(service.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedServices)
                              if (checked) {
                                newSelected.add(service.id)
                              } else {
                                newSelected.delete(service.id)
                              }
                              setSelectedServices(newSelected)

                              // Trigger calculation
                              const roomId = (document.querySelector('[name="roomId"]') as any)?.value
                              const checkIn = (document.getElementById("checkIn") as HTMLInputElement)?.value
                              const checkOut = (document.getElementById("checkOut") as HTMLInputElement)?.value
                              const numberOfGuests = (document.getElementById("numberOfGuests") as HTMLInputElement)?.value
                              if (roomId && checkIn && checkOut) {
                                handleCalculateRate(roomId, checkIn, checkOut, numberOfGuests, newSelected)
                              }
                            }}
                          />
                          <Label htmlFor={`service-${service.id}`} className="text-sm font-normal cursor-pointer">
                            {service.name} ({convert(service.price).toFixed(2)} {currency})
                          </Label>
                        </div>
                      ))}
                      {services.length === 0 && <p className="text-sm text-muted-foreground col-span-2">No services available.</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Booking Status *</Label>
                      <Select name="status" defaultValue="pending" required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="checked-in">Checked In</SelectItem>
                          <SelectItem value="checked-out">Checked Out</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="paymentStatus">Payment Status</Label>
                      <Select name="paymentStatus">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="totalAmount">
                        Total Amount ({currency})
                        {calculatedRate && (
                          <span className="ml-2 text-sm text-muted-foreground">(Calculated: {convert(calculatedRate).toFixed(2)} {currency})</span>
                        )}
                      </Label>
                      <Input
                        id="totalAmount"
                        name="totalAmount"
                        type="number"
                        step="0.01"
                        placeholder={calculatedRate ? convert(calculatedRate).toFixed(2) : "0.00"}
                        defaultValue={calculatedRate ? convert(calculatedRate).toFixed(2) : undefined}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select name="paymentMethod">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Input id="assignedTo" name="assignedTo" placeholder="Staff member name" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Special requests or additional information..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Booking</Button>
                </DialogFooter>
              </form>
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
                placeholder="Search by guest name, booking ID, or room..."
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
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="checked-in">Checked In</TabsTrigger>
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
                <DialogTitle>Booking Details - #{selectedBooking.id}</DialogTitle>
                <DialogDescription>Complete information for this reservation</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Guest Information</Label>
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
                    <Label className="text-muted-foreground">Room Details</Label>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Room:</span> {selectedBooking.room?.room_number}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {selectedBooking.room?.room_type}
                      </p>
                      <p>
                        <span className="font-medium">Guests:</span> {selectedBooking.number_of_guests}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Stay Duration</Label>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Check-in:</span>{" "}
                        {formatDate(selectedBooking.check_in)}
                      </p>
                      <p>
                        <span className="font-medium">Check-out:</span>{" "}
                        {formatDate(selectedBooking.check_out)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Payment</Label>
                    <div className="space-y-2">
                      {selectedBooking.total_amount && (
                        <p>
                          <span className="font-medium">Total:</span> {convert(selectedBooking.total_amount).toFixed(2)} {currency}
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
                {selectedBooking.notes && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Update Status</Label>
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="checked-in">Checked In</SelectItem>
                        <SelectItem value="checked-out">Checked Out</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                        <SelectItem value="pending">Payment Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial Payment</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteBooking(selectedBooking.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete Booking
                  </Button>
                </DialogFooter>
              </div>
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
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
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
        const guestName = booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : "Unknown Guest"

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
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Booking ID: #{booking.id}</p>
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
                            {booking.payment_status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Check-in</p>
                        <p className="text-muted-foreground">{formatDate(booking.check_in)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Check-out</p>
                        <p className="text-muted-foreground">{formatDate(booking.check_out)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Room {booking.room?.room_number}</p>
                        <p className="text-muted-foreground">{booking.room?.room_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {booking.number_of_guests} Guest{booking.number_of_guests > 1 ? "s" : ""}
                        </p>
                        {booking.guest?.phone && <p className="text-muted-foreground">{booking.guest.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Note:</span> {booking.notes}
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
