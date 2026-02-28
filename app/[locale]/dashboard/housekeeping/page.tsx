"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Sparkles, User, FileText, Edit, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { useTranslations } from "next-intl"

interface Room {
    id: number
    room_number: string
    room_type: string
    status?: string // Derived status
}

interface HousekeepingRecord {
    id: number
    room_id: number
    status: string
    last_cleaned: string | null
    cleaner: string | null
    notes: string | null
    updated_at: string
}

const statusColors: Record<string, string> = {
    clean: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    dirty: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    inspecting: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    maintenance: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

export default function HousekeepingPage() {
    const t = useTranslations("Housekeeping")
    const commonT = useTranslations("Common")
    const statusT = useTranslations("Status")
    const [rooms, setRooms] = useState<Room[]>([])
    const [records, setRecords] = useState<HousekeepingRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Dialog states
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [currentRecord, setCurrentRecord] = useState<HousekeepingRecord | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)

    const fetchData = async () => {
        try {
            setLoading(true)
            const [roomsData, recordsData] = await Promise.all([
                api.getRooms(),
                api.getHousekeeping()
            ])
            setRooms(roomsData.items || roomsData) // Handle both formats
            setRecords(recordsData)
            setError(null)
        } catch (err) {
            console.error("Error fetching data:", err)
            setError(err instanceof Error ? err.message : "Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Helper to get latest record for a room
    const getLatestRecord = (roomId: number) => {
        const roomRecords = records.filter(r => r.room_id === roomId)
        // Sort by updated_at descending (assuming updated_at exists, or id)
        return roomRecords.sort((a, b) => b.id - a.id)[0] || null
    }

    const handleUpdateStatus = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedRoom) return

        const formData = new FormData(e.currentTarget)
        const data = {
            room_id: selectedRoom.id,
            status: formData.get("status") as string,
            cleaner: formData.get("cleaner") as string,
            notes: formData.get("notes") as string,
            last_cleaned: formData.get("status") === 'clean' ? new Date().toISOString().split('T')[0] : undefined
        }

        try {
            if (isEditMode && currentRecord) {
                // Update existing
                await api.updateHousekeeping(currentRecord.id, data)
                toast.success("Record updated successfully")
            } else {
                // Create new
                await api.createHousekeeping(data)
                toast.success("Status updated successfully")
            }
            setIsUpdateDialogOpen(false)
            fetchData()
        } catch (err) {
            console.error("Error saving record:", err)
            toast.error("Failed to save record")
        }
    }

    const openUpdateDialog = (room: Room, record: HousekeepingRecord | null, editMode: boolean = false) => {
        setSelectedRoom(room)
        setCurrentRecord(record)
        setIsEditMode(editMode)
        setIsUpdateDialogOpen(true)
    }

    const filteredRooms = rooms.filter(room => {
        const record = getLatestRecord(room.id)
        const status = record?.status || 'clean' // Default to clean if no record

        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (record?.cleaner || "").toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = statusFilter === "all" || status === statusFilter

        return matchesSearch && matchesFilter
    })

    if (loading) return <div>Loading...</div>

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
            </div>

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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 size-4" />
                                <SelectValue placeholder={t("filterStatus")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                                <SelectItem value="clean">{statusT("clean")}</SelectItem>
                                <SelectItem value="dirty">{statusT("dirty")}</SelectItem>
                                <SelectItem value="inspecting">{t("processing")}</SelectItem>
                                <SelectItem value="maintenance">{statusT("maintenance")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("room")}</TableHead>
                                <TableHead>{t("statusLabel")}</TableHead>
                                <TableHead>{t("cleaner")}</TableHead>
                                <TableHead>{t("lastCleaned")}</TableHead>
                                <TableHead>{t("notes")}</TableHead>
                                <TableHead className="text-right">{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRooms.map((room) => {
                                const record = getLatestRecord(room.id)
                                const status = record?.status || 'clean'

                                return (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.room_number}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusColors[status] || "bg-secondary"}>
                                                {statusT(status as any)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{record?.cleaner || "-"}</TableCell>
                                        <TableCell>{record?.last_cleaned || "-"}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={record?.notes || ""}>
                                            {record?.notes || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openUpdateDialog(room, record, true)}
                                                    disabled={!record}
                                                    title={t("editDetails")}
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openUpdateDialog(room, record, false)}
                                                >
                                                    {t("updateStatus")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleUpdateStatus}>
                        <DialogHeader>
                            <DialogTitle>
                                {isEditMode ? t("editDetails") : t("updateStatus")} - {t("room")} {selectedRoom?.room_number}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditMode ? t("modifyRecord") : t("createRecord")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">{t("status")}</Label>
                                <Select name="status" defaultValue={isEditMode ? currentRecord?.status : (currentRecord?.status === 'clean' ? 'dirty' : 'clean')}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="clean">{statusT("clean")}</SelectItem>
                                        <SelectItem value="dirty">{statusT("dirty")}</SelectItem>
                                        <SelectItem value="inspecting">{t("processing")}</SelectItem>
                                        <SelectItem value="maintenance">{statusT("maintenance")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cleaner">{t("cleanerName")}</Label>
                                <Input id="cleaner" name="cleaner" defaultValue={currentRecord?.cleaner || ""} placeholder="e.g. John Doe" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">{t("notes")}</Label>
                                <Input id="notes" name="notes" defaultValue={isEditMode ? currentRecord?.notes || "" : ""} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{t("saveChanges")}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
