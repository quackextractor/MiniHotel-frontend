"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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

const bookingSchema = z.object({
    guestId: z.string().min(1, "Guest is required"),
    roomId: z.string().min(1, "Room is required"),
    checkIn: z.string().min(1, "Check-in date is required"),
    checkOut: z.string().min(1, "Check-out date is required"),
    numberOfGuests: z.preprocess((val) => Number(val), z.number().min(1, "At least 1 guest required")),
    status: z.string().min(1, "Status is required"),
    paymentStatus: z.string().optional(),
    totalAmount: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().optional()),
    paymentMethod: z.string().optional(),
    assignedTo: z.string().optional(),
    notes: z.string().optional()
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: "Check-out date must be after check-in date",
    path: ["checkOut"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

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

    const [openGuestPopover, setOpenGuestPopover] = useState(false)
    const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())
    const [calculatedRate, setCalculatedRate] = useState<number | null>(null)

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            guestId: initialData?.guest_id ? initialData.guest_id.toString() : "",
            roomId: initialData?.room_id?.toString() || "",
            checkIn: initialData?.check_in?.substring(0, 10) || "",
            checkOut: initialData?.check_out?.substring(0, 10) || "",
            numberOfGuests: initialData?.number_of_guests || 2,
            status: initialData?.status || "pending",
            paymentStatus: initialData?.payment_status || "pending",
            totalAmount: initialData?.total_amount ? convert(initialData.total_amount) : undefined,
            paymentMethod: initialData?.payment_method || "cash",
            assignedTo: initialData?.assigned_to || "",
            notes: initialData?.notes || ""
        },
    })

    const watchRoomId = form.watch("roomId")
    const watchCheckIn = form.watch("checkIn")
    const watchCheckOut = form.watch("checkOut")
    const watchNumberOfGuests = form.watch("numberOfGuests")
    const watchGuestId = form.watch("guestId")

    useEffect(() => {
        if (!watchRoomId || !watchCheckIn || !watchCheckOut || !watchNumberOfGuests) return

        const checkInDate = new Date(watchCheckIn)
        const checkOutDate = new Date(watchCheckOut)

        if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate) {
            handleCalculateRate(watchRoomId, watchCheckIn, watchCheckOut, String(watchNumberOfGuests), selectedServices)
        }
    }, [watchRoomId, watchCheckIn, watchCheckOut, watchNumberOfGuests, selectedServices])

    const handleCalculateRate = async (
        roomId: string,
        checkIn: string,
        checkOut: string,
        numberOfGuests: string,
        currentSelectedServices: Set<number>
    ) => {
        try {
            const result = await api.calculateRate({
                room_id: Number(roomId),
                check_in: checkIn,
                check_out: checkOut,
                number_of_guests: numberOfGuests ? Number(numberOfGuests) : undefined,
                service_ids: Array.from(currentSelectedServices),
            })
            setCalculatedRate(result.total_amount || result.calculated_rate)
        } catch (err) {
            console.error("[BookingForm] Error calculating rate:", err)
        }
    }

    const onFormSubmit = async (values: BookingFormValues) => {
        const bookingData: any = {
            guest_id: Number(values.guestId),
            room_id: Number(values.roomId),
            check_in: values.checkIn,
            check_out: values.checkOut,
            number_of_guests: values.numberOfGuests,
            status: values.status,
            notes: values.notes || "",
        }

        if (values.totalAmount !== undefined && !isNaN(values.totalAmount)) {
            bookingData.total_amount = convertToBase(values.totalAmount)
        }

        if (values.paymentStatus) bookingData.payment_status = values.paymentStatus
        if (values.paymentMethod) bookingData.payment_method = values.paymentMethod
        if (values.assignedTo) bookingData.assigned_to = values.assignedTo

        bookingData.services = Array.from(selectedServices)

        if (isEditing) {
            bookingData.id = initialData.id
        }

        try {
            await onSubmit(bookingData)
        } catch (error) {
            console.error("Failed to submit booking", error)
        }
    }

    return (
        <form ref={formRef} onSubmit={form.handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
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
                    <Popover open={openGuestPopover} onOpenChange={setOpenGuestPopover}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openGuestPopover}
                                className={cn("w-full justify-between", form.formState.errors.guestId && "border-destructive")}
                            >
                                {watchGuestId
                                    ? (() => {
                                        const guest = guests.find((g) => g.id.toString() === watchGuestId)
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
                                                    form.setValue("guestId", guest.id.toString(), { shouldValidate: true })
                                                    setOpenGuestPopover(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 size-4",
                                                        watchGuestId === guest.id.toString() ? "opacity-100" : "opacity-0"
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
                    {form.formState.errors.guestId && (
                        <p className="text-sm text-destructive">{form.formState.errors.guestId.message}</p>
                    )}
                </div>

                {/* Room Selection */}
                <div className="grid gap-2">
                    <Label htmlFor="roomId">{t("form.room")} *</Label>
                    <Select
                        value={watchRoomId}
                        onValueChange={(val) => form.setValue("roomId", val, { shouldValidate: true })}
                    >
                        <SelectTrigger className={cn(form.formState.errors.roomId && "border-destructive")}>
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
                    {form.formState.errors.roomId && (
                        <p className="text-sm text-destructive">{form.formState.errors.roomId.message}</p>
                    )}
                </div>

                {/* Dates & Guests */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="checkIn">{t("form.checkInDate")} *</Label>
                        <Input
                            id="checkIn"
                            type="date"
                            {...form.register("checkIn")}
                            className={cn(form.formState.errors.checkIn && "border-destructive")}
                        />
                        {form.formState.errors.checkIn && (
                            <p className="text-sm text-destructive">{form.formState.errors.checkIn.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="checkOut">{t("form.checkOutDate")} *</Label>
                        <Input
                            id="checkOut"
                            type="date"
                            min={watchCheckIn ? new Date(new Date(watchCheckIn).getTime() + 86400000).toISOString().split("T")[0] : undefined}
                            {...form.register("checkOut")}
                            className={cn(form.formState.errors.checkOut && "border-destructive")}
                        />
                        {form.formState.errors.checkOut && (
                            <p className="text-sm text-destructive">{form.formState.errors.checkOut.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="numberOfGuests">{t("form.numberOfGuests")} *</Label>
                        <Input
                            id="numberOfGuests"
                            type="number"
                            min="1"
                            {...form.register("numberOfGuests")}
                            className={cn(form.formState.errors.numberOfGuests && "border-destructive")}
                        />
                        {form.formState.errors.numberOfGuests && (
                            <p className="text-sm text-destructive">{form.formState.errors.numberOfGuests.message}</p>
                        )}
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
                        <Select
                            value={form.watch("status")}
                            onValueChange={(val) => form.setValue("status", val, { shouldValidate: true })}
                        >
                            <SelectTrigger className={cn(form.formState.errors.status && "border-destructive")}>
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
                        {form.formState.errors.status && (
                            <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentStatus">{t("form.paymentStatus")}</Label>
                        <Select
                            value={form.watch("paymentStatus")}
                            onValueChange={(val) => form.setValue("paymentStatus", val, { shouldValidate: true })}
                        >
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
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={calculatedRate && !isEditing ? convert(calculatedRate).toFixed(2) : "0.00"}
                            {...form.register("totalAmount")}
                            className={cn(form.formState.errors.totalAmount && "border-destructive")}
                        />
                        {form.formState.errors.totalAmount && (
                            <p className="text-sm text-destructive">{form.formState.errors.totalAmount.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">{t("form.paymentMethod")}</Label>
                        <Select
                            value={form.watch("paymentMethod")}
                            onValueChange={(val) => form.setValue("paymentMethod", val, { shouldValidate: true })}
                        >
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
                    <Input id="assignedTo" placeholder={t("form.staffMemberName")} {...form.register("assignedTo")} />
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                    <Label htmlFor="notes">{t("form.notes")}</Label>
                    <Textarea id="notes" placeholder={t("form.specialRequests")} {...form.register("notes")} />
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
