"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DoorOpen, Plus, Search, Bed, Users, Wifi, Tv, Coffee, MoreHorizontal, Edit, Trash, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"
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
  amenities?: string
}

const statusColors = {
  available: "bg-green-500/10 text-green-500 border-green-500/20",
  occupied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  maintenance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  cleaning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

const ALL_AMENITIES = ["wifi", "tv", "coffee"]

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

  // Room Dialog State
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const formRef = useEnterNavigation()

  // Room Group Dialog State
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<RoomGroup | null>(null)
  const groupFormRef = useEnterNavigation()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [roomsData, groupsData] = await Promise.all([
        api.getRooms(),
        api.getRoomGroups()
      ])
      setRooms(roomsData.items || roomsData)
      setRoomGroups(groupsData)
      setError(null)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const openAddRoomDialog = () => {
    setEditingRoom(null)
    setSelectedAmenities([])
    setIsRoomDialogOpen(true)
  }

  const openEditRoomDialog = (room: Room) => {
    setEditingRoom(room)
    setSelectedAmenities(room.amenities ? room.amenities.split(",").filter(Boolean) : [])
    setIsRoomDialogOpen(true)
  }

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const inputPrice = Number(formData.get("price"))
      const basePrice = convertToBase(inputPrice)

      const payload = {
        room_number: formData.get("roomNumber"),
        room_type: formData.get("roomType"),
        capacity: Number(formData.get("capacity")),
        base_rate: basePrice,
        description: formData.get("description"),
        group_id: formData.get("groupId") && formData.get("groupId") !== "0" ? Number(formData.get("groupId")) : null,
        amenities: selectedAmenities.join(",")
      }

      if (editingRoom) {
        const updatedRoom = await api.updateRoom(editingRoom.id, payload)
        setRooms(rooms.map(r => r.id === editingRoom.id ? updatedRoom : r))
        toast.success(t("roomUpdated", { fallback: "Room updated successfully" }))
      } else {
        const newRoom = await api.createRoom(payload)
        setRooms([...rooms, newRoom])
        toast.success(t("roomCreated", { fallback: "Room created successfully" }))
      }
      setIsRoomDialogOpen(false)
    } catch (err) {
      console.error("Error saving room:", err)
      toast.error(t("roomSaveError", { fallback: "Failed to save room. Please try again." }))
    }
  }

  const handleDeleteRoom = async (id: number) => {
    if (!confirm(t("confirmDeleteRoom", { fallback: "Are you sure you want to delete this room?" }))) return
    try {
      await api.deleteRoom(id)
      setRooms(rooms.filter(r => r.id !== id))
      toast.success(t("roomDeleted", { fallback: "Room deleted successfully" }))
    } catch (err) {
      console.error("Error deleting room:", err)
      toast.error(t("roomDeleteError", { fallback: "Failed to delete room." }))
    }
  }

  const openAddGroupDialog = () => {
    setEditingGroup(null)
    setIsGroupDialogOpen(true)
  }

  const openEditGroupDialog = (group: RoomGroup) => {
    setEditingGroup(group)
    setIsGroupDialogOpen(true)
  }

  const handleSaveGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const payload = {
        name: formData.get("name"),
        description: formData.get("description"),
        parent_group_id: formData.get("parentGroupId") && formData.get("parentGroupId") !== "0" ? Number(formData.get("parentGroupId")) : null
      }

      if (editingGroup) {
        await api.updateRoomGroup(editingGroup.id, payload)
        toast.success(t("groupUpdated", { fallback: "Room group updated successfully" }))
      } else {
        await api.createRoomGroup(payload)
        toast.success(t("groupCreated", { fallback: "Room group created successfully" }))
      }
      setIsGroupDialogOpen(false)
      fetchData() // Refresh everything to get the correct tree structure
    } catch (err) {
      console.error("Error saving room group:", err)
      toast.error(t("groupSaveError", { fallback: "Failed to save room group. Please try again." }))
    }
  }

  const handleDeleteGroup = async (id: number) => {
    if (!confirm(t("confirmDeleteGroup", { fallback: "Are you sure you want to delete this group?" }))) return
    try {
      await api.deleteRoomGroup(id)
      toast.success(t("groupDeleted", { fallback: "Room group deleted successfully" }))
      fetchData() // Refresh tree
    } catch (err) {
      console.error("Error deleting group:", err)
      toast.error(t("groupDeleteError", { fallback: "Failed to delete room group. Make sure it has no items inside." }))
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  const renderRoomCard = (room: Room) => {
    const roomAmenities = room.amenities ? room.amenities.split(",").filter(Boolean) : []

    return (
      <Card key={room.id} className="transition-all hover:shadow-md relative group">
        <CardHeader className="p-4 pb-2 pr-10">
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditRoomDialog(room)}>
                  <Edit className="mr-2 h-4 w-4" /> {t("edit", { fallback: "Edit" })}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRoom(room.id)}>
                  <Trash className="mr-2 h-4 w-4" /> {t("delete", { fallback: "Delete" })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CardDescription className="capitalize">{room.room_type}</CardDescription>
            <Badge variant="outline" className={`text-[10px] h-5 ${statusColors.available}`}>
              {t("status.available")}
            </Badge>
          </div>
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
          {roomAmenities.length > 0 && (
            <div className="mt-3 flex gap-2">
              {roomAmenities.map((amenity) => {
                const Icon = amenityIcons[amenity]
                if (!Icon) return null
                return (
                  <div
                    key={amenity}
                    className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                    title={amenity}
                  >
                    <Icon className="size-3.5" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Recursive render function
  const renderGroup = (group: RoomGroup) => {
    const groupRooms = rooms.filter(r => r.group_id === group.id)

    return (
      <AccordionItem key={group.id} value={`group-${group.id}`} className="group/item">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2 flex-1 relative">
            <span className="font-semibold text-lg">{group.name}</span>
            <Badge variant="secondary" className="ml-2">{groupRooms.length} rooms</Badge>
          </div>
        </AccordionTrigger>
        <div className="absolute right-10 top-3 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditGroupDialog(group); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteGroup(group.id); }}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        <AccordionContent className="pl-4 border-l ml-2">
          {/* Render Rooms in this group */}
          {groupRooms.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4 mt-2">
              {groupRooms.map(renderRoomCard)}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-4 mb-4 border border-dashed rounded-lg flex items-center justify-center">
              {t("noRoomsInGroup", { fallback: "No rooms in this group" })}
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

  // Only show ungrouped rooms for the search results if we aren't displaying by groups, or at the top
  const ungroupedRooms = filteredRooms.filter(r => !r.group_id)
  const groupTree = buildGroupTree(roomGroups)

  if (loading) {
    return (
      <div className="flex bg-muted/40 items-center justify-center p-8 flex-1">
        <div className="text-muted-foreground">Loading rooms...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex bg-muted/40 items-center justify-center p-8 flex-1">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  // Flat list of groups for the dropdowns
  const flatGroups: RoomGroup[] = []
  const flattenGroups = (nodes: RoomGroup[], depth = 0) => {
    nodes.forEach(node => {
      flatGroups.push({ ...node, name: `${"　".repeat(depth)}${depth > 0 ? '└ ' : ''}${node.name}` })
      if (node.children) flattenGroups(node.children, depth + 1)
    })
  }
  flattenGroups(groupTree)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={openAddGroupDialog}>
            <Plus className="mr-2 size-4" />
            {t("addGroup", { fallback: "Add Group" })}
          </Button>
          <Button onClick={openAddRoomDialog}>
            <Plus className="mr-2 size-4" />
            {t("addRoom")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchRooms")}
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("types.filterByType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("types.allTypes")}</SelectItem>
            <SelectItem value="single">{t("types.single")}</SelectItem>
            <SelectItem value="double">{t("types.double")}</SelectItem>
            <SelectItem value="suite">{t("types.suite")}</SelectItem>
            <SelectItem value="deluxe">{t("types.deluxe")}</SelectItem>
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
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">{t("roomGroups")}</h2>
          <Accordion type="multiple" className="w-full space-y-2">
            {groupTree.map(renderGroup)}
          </Accordion>
        </div>
      )}

      {filteredRooms.length === 0 && roomGroups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t("noRoomsFound")}</h3>
            <p className="text-sm text-muted-foreground">{t("tryAdjustingSearch")}</p>
          </CardContent>
        </Card>
      )}

      {/* Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveRoom} ref={formRef}>
            <DialogHeader>
              <DialogTitle>{editingRoom ? t("editRoom", { fallback: "Edit Room" }) : t("addRoomTitle")}</DialogTitle>
              <DialogDescription>{editingRoom ? t("editRoomDescription", { fallback: "Update room details." }) : t("addRoomDescription")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roomNumber" className="text-right">
                  {t("form.number")}
                </Label>
                <Input id="roomNumber" name="roomNumber" defaultValue={editingRoom?.room_number} placeholder="101" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roomType" className="text-right">
                  {t("form.type")}
                </Label>
                <Select name="roomType" required defaultValue={editingRoom?.room_type || "single"}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">{t("types.single")}</SelectItem>
                    <SelectItem value="double">{t("types.double")}</SelectItem>
                    <SelectItem value="suite">{t("types.suite")}</SelectItem>
                    <SelectItem value="deluxe">{t("types.deluxe")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  {t("form.capacity")}
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue={editingRoom?.capacity || 2}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  {t("form.price")} ({currency})
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingRoom ? convert(editingRoom.base_rate) : ""}
                  className="col-span-3"
                  required
                  placeholder={t("form.amountPlaceholder", { currency })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groupId" className="text-right">
                  {t("form.group")}
                </Label>
                <Select name="groupId" defaultValue={editingRoom?.group_id ? String(editingRoom.group_id) : "0"}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("form.noGroup")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t("form.noGroup")}</SelectItem>
                    {flatGroups.map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  {t("amenities", { fallback: "Amenities" })}
                </Label>
                <div className="col-span-3 flex flex-wrap gap-4 mt-1">
                  {ALL_AMENITIES.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={selectedAmenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label
                        htmlFor={`amenity-${amenity}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                      >
                        {t(`amenities_${amenity}`, { fallback: amenity })}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  {t("form.description")}
                </Label>
                <Textarea id="description" name="description" defaultValue={editingRoom?.description} className="col-span-3" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit">{editingRoom ? t("save", { fallback: "Save Changes" }) : t("saveRoom")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveGroup} ref={groupFormRef}>
            <DialogHeader>
              <DialogTitle>{editingGroup ? t("editGroup", { fallback: "Edit Room Group" }) : t("addGroupTitle", { fallback: "Add Room Group" })}</DialogTitle>
              <DialogDescription>{editingGroup ? t("editGroupDescription", { fallback: "Update room group details." }) : t("addGroupDescription", { fallback: "Create a new hierarchy block to organize your rooms." })}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groupName" className="text-right">
                  {t("form.name", { fallback: "Name" })}
                </Label>
                <Input id="groupName" name="name" defaultValue={editingGroup?.name} placeholder="First Floor" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentGroupId" className="text-right">
                  {t("form.parentGroup", { fallback: "Parent Group" })}
                </Label>
                <Select name="parentGroupId" defaultValue={editingGroup?.parent_group_id ? String(editingGroup.parent_group_id) : "0"}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("form.none", { fallback: "None (Top Level)" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t("form.none", { fallback: "None (Top Level)" })}</SelectItem>
                    {/* Exclude the current editing group from being its own parent */}
                    {flatGroups.filter(g => g.id !== editingGroup?.id).map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groupDesc" className="text-right">
                  {t("form.description")}
                </Label>
                <Textarea id="groupDesc" name="description" defaultValue={editingGroup?.description} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingGroup ? t("save", { fallback: "Save Changes" }) : t("saveGroup", { fallback: "Create Group" })}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
