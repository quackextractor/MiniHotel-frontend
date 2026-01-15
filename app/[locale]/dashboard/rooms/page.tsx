"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import { DoorOpen, Plus, Search, Bed, Users, Wifi, Tv, Coffee } from "lucide-react"
import { api } from "@/lib/api"
// import { useSettings } from "@/lib/settings-context" // Removed as we use custom hooks/next-intl
import { useEnterNavigation } from "@/hooks/use-enter-navigation"
import { useTranslations, useFormatter } from "next-intl"
import { useCurrency } from "@/hooks/use-currency"

interface Room {
  id: number
  room_number: string
  room_type: string
  capacity: number
  base_rate: number
  description?: string
  group_id?: number
  is_active: boolean
}

const statusColors = {
  available: "bg-green-500/10 text-green-500 border-green-500/20",
  occupied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  maintenance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  cleaning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  tv: Tv,
  coffee: Coffee,
}

export default function RoomsPage() {
  const t = useTranslations("Rooms")
  const format = useFormatter()
  const { convert, currency } = useCurrency()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const formRef = useEnterNavigation()

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true)
        console.log("[v0] Fetching rooms from API...")
        const data = await api.getRooms()
        console.log("[v0] Rooms received:", data)
        setRooms(data)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching rooms:", err)
        setError(err instanceof Error ? err.message : "Failed to load rooms")
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [])

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || room.room_type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesType
  })

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      console.log("[v0] Creating new room...")
      const newRoom = await api.createRoom({
        room_number: formData.get("number") as string,
        room_type: formData.get("type") as string,
        capacity: Number(formData.get("capacity")),
        base_rate: Number(formData.get("price")),
        description: formData.get("description") as string,
      })
      console.log("[v0] Room created:", newRoom)
      setRooms([...rooms, newRoom])
      setIsAddDialogOpen(false)
    } catch (err) {
      console.error("[v0] Error creating room:", err)
      toast.error("Failed to create room: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Rooms</CardTitle>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("rooms")}</h1>
          <p className="text-muted-foreground">Manage your hotel rooms and their availability</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              {t("addRoom")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form ref={formRef} onSubmit={handleAddRoom}>
              <DialogHeader>
                <DialogTitle>{t("addRoom")}</DialogTitle>
                <DialogDescription>Create a new room in your hotel inventory</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="number">{t("roomNumber")}</Label>
                  <Input id="number" name="number" placeholder="101" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">{t("roomType")}</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="floor">{t("floor")}</Label>
                    <Input id="floor" name="floor" type="number" placeholder="1" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">{t("capacity")}</Label>
                    <Input id="capacity" name="capacity" type="number" placeholder="2" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">{t("pricePerNight")}</Label>
                  <Input id="price" name="price" type="number" placeholder="120" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">{t("description")}</Label>
                  <Textarea id="description" name="description" placeholder="Room description..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{t("addRoom")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
          <CardDescription>Search and filter rooms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t("searchRooms")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <DoorOpen className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                    <CardDescription className="capitalize">{room.room_type}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={statusColors.available}>
                  {room.is_active ? "available" : "inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{room.description || "No description"}</p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Bed className="size-4 text-muted-foreground" />
                  <span>Capacity</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="size-4 text-muted-foreground" />
                  <span>{room.capacity} guests</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-2xl font-bold">{format.number(convert(room.base_rate), { style: 'currency', currency: currency })}</p>
                  <p className="text-xs text-muted-foreground">per night</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t("noRoomsFound")}</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
