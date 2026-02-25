"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Percent, Plus, Search, Calendar, Edit2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useTranslations, useFormatter } from "next-intl"

interface SeasonalRate {
    id: number
    name: string
    start_date: string
    end_date: string
    rate_multiplier: number
    room_type?: string
    room_group_id?: number
}

interface RoomGroup {
    id: number
    name: string
}

export default function RatesPage() {
    const t = useTranslations("Rates")
    const format = useFormatter()
    const [rates, setRates] = useState<SeasonalRate[]>([])
    const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedRate, setSelectedRate] = useState<SeasonalRate | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [ratesData, groupsData] = await Promise.all([
                    api.getSeasonalRates(),
                    api.getRoomGroups()
                ])
                setRates(ratesData)
                setRoomGroups(groupsData)
                setError(null)
            } catch (err) {
                console.error("Error fetching rates data:", err)
                setError(err instanceof Error ? err.message : "Failed to load data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredRates = rates.filter((rate) =>
        rate.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSaveRate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        try {
            const multiplier = Number(formData.get("multiplier"))
            if (isNaN(multiplier) || multiplier <= 0) {
                throw new Error("Invalid multiplier")
            }

            const payload = {
                name: formData.get("name") as string,
                start_date: formData.get("startDate") as string,
                end_date: formData.get("endDate") as string,
                rate_multiplier: multiplier,
                room_type: formData.get("roomType") as string || null,
                room_group_id: formData.get("roomGroupId") ? Number(formData.get("roomGroupId")) : null
            }

            if (selectedRate) {
                const updatedRate = await api.updateSeasonalRate(selectedRate.id, payload)
                setRates(rates.map(r => r.id === selectedRate.id ? updatedRate : r))
                toast.success(t("rateUpdated") || "Rate updated successfully")
            } else {
                const newRate = await api.createSeasonalRate(payload)
                setRates([...rates, newRate])
                toast.success(t("rateCreated"))
            }

            setIsAddDialogOpen(false)
            setSelectedRate(null)
        } catch (err) {
            console.error("Error saving rate:", err)
            toast.error("Failed to save rate: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    const handleDeleteRate = async (id: number) => {
        if (!confirm(t("deleteConfirmMessage") || "Are you sure you want to delete this rate?")) return

        try {
            await api.deleteSeasonalRate(id)
            setRates(rates.filter((r) => r.id !== id))
            toast.success(t("rateDeleted") || "Rate deleted successfully")
        } catch (err) {
            console.error("Error deleting rate:", err)
            toast.error("Failed to delete rate: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    const openEditDialog = (rate: SeasonalRate) => {
        setSelectedRate(rate)
        setIsAddDialogOpen(true)
    }

    const openAddDialog = () => {
        setSelectedRate(null)
        setIsAddDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="mt-4 text-muted-foreground">{t("loadingRates")}</p>
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
                        <Button onClick={openAddDialog}>
                            <Plus className="mr-2 size-4" />
                            {t("addRate")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSaveRate}>
                            <DialogHeader>
                                <DialogTitle>{selectedRate ? (t("editRate") || "Edit Rate") : t("addRate")}</DialogTitle>
                                <DialogDescription>{t("addRateDescription")}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">{t("rateName")}</Label>
                                    <Input id="name" name="name" defaultValue={selectedRate?.name || ""} placeholder={t("rateNamePlaceholder")} required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="startDate">{t("startDate")}</Label>
                                        <Input
                                            id="startDate"
                                            name="startDate"
                                            type="date"
                                            defaultValue={selectedRate?.start_date || ""}
                                            required
                                            onChange={(e) => {
                                                const endDateInput = document.getElementById("endDate") as HTMLInputElement
                                                if (endDateInput) {
                                                    const startDate = new Date(e.target.value)
                                                    if (!isNaN(startDate.getTime())) {
                                                        const minEndDate = new Date(startDate.getTime() + 86400000)
                                                        const minEndDateStr = minEndDate.toISOString().split('T')[0]
                                                        endDateInput.min = minEndDateStr

                                                        if (endDateInput.value && endDateInput.value < minEndDateStr) {
                                                            endDateInput.value = minEndDateStr
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="endDate">{t("endDate")}</Label>
                                        <Input
                                            id="endDate"
                                            name="endDate"
                                            type="date"
                                            defaultValue={selectedRate?.end_date || ""}
                                            required
                                            onChange={(e) => {
                                                const startDateInput = document.getElementById("startDate") as HTMLInputElement
                                                if (startDateInput && startDateInput.value && e.target.value) {
                                                    const startDate = new Date(startDateInput.value)
                                                    const endDate = new Date(e.target.value)
                                                    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                                        if (endDate <= startDate) {
                                                            const minEndDate = new Date(startDate.getTime() + 86400000)
                                                            e.target.value = minEndDate.toISOString().split('T')[0]
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="multiplier">{t("multiplier")}</Label>
                                    <Input
                                        id="multiplier"
                                        name="multiplier"
                                        type="number"
                                        placeholder="1.0"
                                        defaultValue={selectedRate?.rate_multiplier || ""}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">{t("multiplierHelp")}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="roomType">{t("roomType")} ({t("optional")})</Label>
                                    <Select name="roomType" defaultValue={selectedRate?.room_type || undefined}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("selectRoomType")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single</SelectItem>
                                            <SelectItem value="double">Double</SelectItem>
                                            <SelectItem value="suite">Suite</SelectItem>
                                            <SelectItem value="deluxe">Deluxe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="roomGroupId">{t("roomGroup")} ({t("optional")})</Label>
                                    <Select name="roomGroupId" defaultValue={selectedRate?.room_group_id?.toString() || undefined}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("selectRoomGroup")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.map(group => (
                                                <SelectItem key={group.id} value={group.id.toString()}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                            <DialogFooter>
                                <Button type="submit">{selectedRate ? (t("updateRate") || "Update Rate") : t("createRate")}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("filters")}</CardTitle>
                    <CardDescription>{t("searchRates")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRates.map((rate) => (
                    <Card key={rate.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                        <Calendar className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{rate.name}</CardTitle>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <span>{rate.start_date} - {rate.end_date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                        x{rate.rate_multiplier}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rate)}>
                                        <Edit2 className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive 
hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteRate(rate.id)}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                {rate.room_type && (
                                    <div className="flex justify-between">
                                        <span>Room Type:</span>
                                        <span className="font-medium">{rate.room_type}</span>
                                    </div>
                                )}
                                {rate.room_group_id && (
                                    <div className="flex justify-between">
                                        <span>Group ID:</span>
                                        <span className="font-medium">{rate.room_group_id}</span>
                                    </div>
                                )}
                                {!rate.room_type && !rate.room_group_id && (
                                    <div className="italic">Applies to all rooms</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredRates.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Percent className="size-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">{t("noRatesFound")}</h3>
                        <p className="text-sm text-muted-foreground">{t("tryAdjustingSearch")}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
