"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

import { useEnterNavigation } from "@/hooks/use-enter-navigation"
import { useCurrency } from "@/hooks/use-currency"
import { api } from "@/lib/api"
import { Booking } from "@/lib/types"

interface BookingFormProps {
    initialData?: Partial<Booking>
    rooms: any[]
    guests: any[]
    services: any[]
    onSubmit: (data: any) => Promise<void>
    onCancel: () => void
    onGuestCreateClick?: () => void
}

export function BookingForm({
    initialData,
    rooms,
    guests,
    services,
    onSubmit,
    onCancel,
    onGuestCreateClick,
}: BookingFormProps) {
    const t = useTranslations("Bookings")
    const tCommon = useTranslations("Common")
    const { convert, convertToBase, currency } = useCurrency()
    const formRef = useEnterNavigation()

    const isEditing = !!initialData?.id

    const [selectedGuestId, setSelectedGuestId] = useState<string>(
        initialData?.guest_id ? initialData.guest_id.toString() : ""
    )
    const [openGuestPopover, setOpenGuestPopover] = useState(false)
    const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())
    const [calculatedRate, setCalculatedRate] = useState<number | null>(null)

    useEffect(() => {
        if (initialData?.id) {
            // If editing, load initial services if available inside initialData.services
            // But initialData from API usually comes with selected services differently or not exposed.
            // This is a simplified approach, adjust based on actual API behavior.
        }
    }, [initialData])

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
            setCalculatedRate(result.total_amount || result.calculated_rate)
        } catch (err) {
            console.error("[BookingForm] Error calculating rate:", err)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const bookingData: any = {
            guest_id: Number(formData.get("guestId")),
            room_id: Number(formData.get("roomId")),
            check_in: formData.get("checkIn") as string,
            check_out: formData.get("checkOut") as string,
            number_of_guests: Number(formData.get("numberOfGuests")),
            status: formData.get("status") as string,
            notes: formData.get("notes") as string,
        }

        const checkInDate = new Date(bookingData.check_in)
        const checkOutDate = new Date(bookingData.check_out)

        if (checkOutDate <= checkInDate) {
            toast.error(t("form.checkOutBeforeCheckInError") || "Check-out date must be after check-in date")
            return
        }

        if (bookingData.number_of_guests < 1) {
            toast.error(t("form.invalidGuestsError") || "Number of guests must be at least 1")
            return
        }

        const totalAmountInput = formData.get("totalAmount")
        if (totalAmountInput) {
            bookingData.total_amount = convertToBase(Number(totalAmountInput))
        }

        const paymentStatus = formData.get("paymentStatus")
        if (paymentStatus) bookingData.payment_status = paymentStatus

        const paymentMethod = formData.get("paymentMethod")
        if (paymentMethod) bookingData.payment_method = paymentMethod

        const assignedTo = formData.get("assignedTo")
        if (assignedTo) bookingData.assigned_to = assignedTo

        bookingData.services = Array.from(selectedServices)

        if (isEditing) {
            // Retain the ID for parent to know what to update
            bookingData.id = initialData.id
        }

        await onSubmit(bookingData)
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                {/* Guest Selection */}
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="guestId">{t("form.guest")} *</Label>
                        {onGuestCreateClick && (
                            <Button type="button" variant="outline" size="sm" onClick={onGuestCreateClick}>
                                <UserPlus className="mr-2 size-4" />
                                {t("form.newGuest")}
                            </Button>
                        )}
                    </div>
                    <input type="hidden" name="guestId" value={selectedGuestId} required />
                    <Popover open={openGuestPopover} onOpenChange={setOpenGuestPopover}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openGuestPopover}
                                className="w-full justify-between"
                            >
                                {selectedGuestId
                                    ? (() => {
                                        const guest = guests.find((g) => g.id.toString() === selectedGuestId)
                                        return guest
                                            ? `${guest.first_name} ${guest.last_name} ${guest.email ? `(${guest.email})` : ""}`
                                            : t("form.selectGuest")
                                    })()
                                    : t("form.selectGuest")}
                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder={t("form.searchGuest")} />
                                <CommandList>
                                    <CommandEmpty>{t("form.noGuestFound")}</CommandEmpty>
                                    <CommandGroup>
                                        {guests.map((guest) => (
                                            <CommandItem
                                                key={guest.id}
                                                value={`${guest.first_name} ${guest.last_name} ${guest.email || ""}`}
                                                onSelect={() => {
                                                    setSelectedGuestId(guest.id.toString())
                                                    setOpenGuestPopover(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 size-4",
                                                        selectedGuestId === guest.id.toString() ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {guest.first_name} {guest.last_name}{" "}
                                                {guest.email && <span className="ml-2 text-muted-foreground">({guest.email})</span>}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Room Selection */}
                <div className="grid gap-2">
                    <Label htmlFor="roomId">{t("form.room")} *</Label>
                    <Select
                        name="roomId"
                        required
                        defaultValue={initialData?.room_id?.toString()}
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
                            <SelectValue placeholder={t("form.selectRoom")} />
                        </SelectTrigger>
                        <SelectContent>
                            {rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                    Room {room.room_number} - {room.room_type} (${room.base_rate}/night, Capacity: {room.capacity})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Dates & Guests */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="checkIn">{t("form.checkInDate")} *</Label>
                        <Input
                            id="checkIn"
                            name="checkIn"
                            type="date"
                            required
                            defaultValue={initialData?.check_in?.substring(0, 10)}
                            onChange={(e) => {
                                const roomId = (document.querySelector('[name="roomId"]') as HTMLInputElement)?.value
                                const checkOutInput = document.getElementById("checkOut") as HTMLInputElement
                                const numberOfGuests = (document.getElementById("numberOfGuests") as HTMLInputElement)?.value

                                if (checkOutInput) {
                                    const checkInDate = new Date(e.target.value)
                                    if (!isNaN(checkInDate.getTime())) {
                                        const minCheckOut = new Date(checkInDate.getTime() + 86400000)
                                        const minCheckOutStr = minCheckOut.toISOString().split("T")[0]
                                        checkOutInput.min = minCheckOutStr

                                        if (checkOutInput.value && checkOutInput.value < minCheckOutStr) {
                                            checkOutInput.value = minCheckOutStr
                                        }
                                    }
                                }

                                if (roomId && checkOutInput?.value) {
                                    handleCalculateRate(roomId, e.target.value, checkOutInput.value, numberOfGuests)
                                }
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="checkOut">{t("form.checkOutDate")} *</Label>
                        <Input
                            id="checkOut"
                            name="checkOut"
                            type="date"
                            required
                            defaultValue={initialData?.check_out?.substring(0, 10)}
                            onChange={(e) => {
                                const roomId = (document.querySelector('[name="roomId"]') as HTMLInputElement)?.value
                                const checkIn = (document.getElementById("checkIn") as HTMLInputElement)?.value
                                const numberOfGuests = (document.getElementById("numberOfGuests") as HTMLInputElement)?.value
                                if (roomId && checkIn) {
                                    handleCalculateRate(roomId, checkIn, e.target.value, numberOfGuests)
                                }
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="numberOfGuests">{t("form.numberOfGuests")} *</Label>
                        <Input
                            id="numberOfGuests"
                            name="numberOfGuests"
                            type="number"
                            min="1"
                            placeholder="2"
                            required
                            defaultValue={initialData?.number_of_guests || ""}
                            onChange={(e) => {
                                const roomId = (document.querySelector('[name="roomId"]') as HTMLInputElement)?.value
                                const checkIn = (document.getElementById("checkIn") as HTMLInputElement)?.value
                                const checkOut = (document.getElementById("checkOut") as HTMLInputElement)?.value
                                if (roomId && checkIn && checkOut) {
                                    handleCalculateRate(roomId, checkIn, checkOut, e.target.value)
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Services */}
                {!isEditing && (
                    <div className="grid gap-2">
                        <Label>{t("selectServices")}</Label>
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

                                            const roomId = (document.querySelector('[name="roomId"]') as HTMLInputElement)?.value
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
                            {services.length === 0 && <p className="text-sm text-muted-foreground col-span-2">{t("noServicesAvailable")}</p>}
                        </div>
                    </div>
                )}

                {/* Statuses */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="status">{t("form.bookingStatus")} *</Label>
                        <Select name="status" defaultValue={initialData?.status || "pending"} required>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                                <SelectItem value="pending">{t("status.pending")}</SelectItem>
                                <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                                <SelectItem value="checked-in">{t("status.checkedIn")}</SelectItem>
                                <SelectItem value="checked-out">{t("status.checkedOut")}</SelectItem>
                                <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentStatus">{t("form.paymentStatus")}</Label>
                        <Select name="paymentStatus" defaultValue={initialData?.payment_status || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("form.selectPaymentStatus")} />
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

                {/* Amount & Payment Method */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="totalAmount">
                            {t("form.totalAmount", { currency })}
                            {calculatedRate && !isEditing && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                    ({t("calculated")}: {convert(calculatedRate).toFixed(2)} {currency})
                                </span>
                            )}
                        </Label>
                        <Input
                            id="totalAmount"
                            name="totalAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={calculatedRate && !isEditing ? convert(calculatedRate).toFixed(2) : "0.00"}
                            defaultValue={
                                initialData?.total_amount
                                    ? convert(initialData.total_amount).toFixed(2)
                                    : calculatedRate && !isEditing
                                        ? convert(calculatedRate).toFixed(2)
                                        : undefined
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">{t("form.paymentMethod")}</Label>
                        <Select name="paymentMethod" defaultValue={initialData?.payment_method || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("form.selectPaymentMethod")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">{t("paymentMethod.cash")}</SelectItem>
                                <SelectItem value="card">{t("paymentMethod.card")}</SelectItem>
                                <SelectItem value="bank_transfer">{t("paymentMethod.bankTransfer")}</SelectItem>
                                <SelectItem value="online">{t("paymentMethod.online")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Assigned To */}
                <div className="grid gap-2">
                    <Label htmlFor="assignedTo">{t("form.assignedTo")}</Label>
                    <Input id="assignedTo" name="assignedTo" defaultValue={initialData?.assigned_to} placeholder={t("form.staffMemberName")} />
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                    <Label htmlFor="notes">{t("form.notes")}</Label>
                    <Textarea id="notes" name="notes" defaultValue={initialData?.notes} placeholder={t("form.specialRequests")} />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {tCommon("cancel")}
                </Button>
                <Button type="submit">
                    {isEditing ? tCommon("save") : t("createBooking")}
                </Button>
            </div>
        </form>
    )
}
