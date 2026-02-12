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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface RoomGroup {
  id: number
  name: string
  description?: string
  parent_group_id?: number | null
  children?: RoomGroup[]
}

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
  const { convert, convertToBase, currency } = useCurrency()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const formRef = useEnterNavigation()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        console.log("[v0] Fetching rooms and groups...")
        const [roomsData, groupsData] = await Promise.all([
          api.getRooms(),
          api.getRoomGroups()
        ])
        setRooms(roomsData.items || roomsData)
        setRoomGroups(groupsData)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      console.log("[v0] Creating new room...")
      const inputPrice = Number(formData.get("price"))
      const basePrice = convertToBase(inputPrice)

      const newRoom = await api.createRoom({
        room_number: formData.get("roomNumber"),
        room_type: formData.get("roomType"),
        capacity: Number(formData.get("capacity")),
        base_rate: basePrice,
        description: formData.get("description"),
        group_id: formData.get("groupId") ? Number(formData.get("groupId")) : null
      })

      console.log("[v0] Room created:", newRoom)
      setRooms([...rooms, newRoom])
      setIsAddDialogOpen(false)
      toast.success("Room created successfully")
    } catch (err) {
      console.error("[v0] Error creating room:", err)
      toast.error("Failed to create room. Please try again.")
    }
  }

  // Build tree from flat groups list
  const buildGroupTree = (groups: RoomGroup[]) => {
    const groupMap = new Map<number, RoomGroup>()
    const rootGroups: RoomGroup[] = []

    // Pass 1: Create map and initialize children
    groups.forEach(g => {
      groupMap.set(g.id, { ...g, children: [] })
    })

    // Pass 2: Link children
    groups.forEach(g => {
      if (g.parent_group_id) {
        const parent = groupMap.get(g.parent_group_id)
        if (parent) {
          parent.children?.push(groupMap.get(g.id)!)
        }
      } else {
        rootGroups.push(groupMap.get(g.id)!)
      }
    })

    return rootGroups
  }

  const renderRoomCard = (room: Room) => (
    <Card key={room.id} className="cursor-pointer transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
          <Badge variant="outline" className={statusColors.available}>
            Available
          </Badge>
        </div>
        <CardDescription className="capitalize">{room.room_type}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-1 size-4" />
            {room.capacity} Guests
          </div>
          <div className="font-medium">
            {convert(room.base_rate).toFixed(2)} {currency} / night
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {Object.entries(amenityIcons).map(([key, Icon]) => (
            <div
              key={key}
              className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              title={key}
            >
              <Icon className="size-3.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Recursive render function
  const renderGroup = (group: RoomGroup) => {
    const groupRooms = rooms.filter(r => r.group_id === group.id)
    const hasContent = groupRooms.length > 0 || (group.children && group.children.length > 0)

    if (!hasContent) return null

    return (
      <AccordionItem key={group.id} value={`group-${group.id}`}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{group.name}</span>
            <Badge variant="secondary" className="ml-2">{groupRooms.length} rooms</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pl-4 border-l ml-2">
          {/* Render Rooms in this group */}
          {groupRooms.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
              {groupRooms.map(renderRoomCard)}
            </div>
          )}

          {/* Render Children Groups */}
          {group.children && group.children.length > 0 && (
            <Accordion type="multiple" className="w-full">
              {group.children.map(renderGroup)}
            </Accordion>
          )}
        </AccordionContent>
      </AccordionItem>
    )
  }

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || room.room_type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesType
  })

  const ungroupedRooms = filteredRooms.filter(r => !r.group_id)
  const groupTree = buildGroupTree(roomGroups)

  if (loading) {
    return (
      <div className="flex bg-muted/40 items-center justify-center p-8">
        <div className="text-muted-foreground">Loading rooms...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex bg-muted/40 items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">Manage your hotel rooms and their status</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddRoom} ref={formRef}>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>Enter the details for the new room. Click save when you're done.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roomNumber" className="text-right">
                    Number
                  </Label>
                  <Input id="roomNumber" name="roomNumber" placeholder="101" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roomType" className="text-right">
                    Type
                  </Label>
                  <Select name="roomType" required defaultValue="single">
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right">
                    Capacity
                  </Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    defaultValue="2"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price ({currency})
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="col-span-3"
                    required
                    placeholder={`Amount in ${currency}`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="groupId" className="text-right">
                    Group
                  </Label>
                  <Select name="groupId">
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="No Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Group</SelectItem>
                      {roomGroups.map(g => (
                        <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea id="description" name="description" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Room</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search rooms..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
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

      {/* Render Ungrouped Rooms first */}
      {ungroupedRooms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ungroupedRooms.map(renderRoomCard)}
        </div>
      )}

      {/* Render Groups Accordion */}
      {groupTree.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Room Groups</h2>
          <Accordion type="multiple" className="w-full">
            {groupTree.map(renderGroup)}
          </Accordion>
        </div>
      )}

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No rooms found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
