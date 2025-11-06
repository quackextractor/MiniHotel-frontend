"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, Calendar, MapPin, Clock, User } from "lucide-react"
import { api } from "@/lib/api"

interface Event {
  id: number
  name: string
  event_date: string
  space: string
  expected_guests: number
  status: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
  tentative: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  "pending payment": "bg-orange-500/10 text-orange-500 border-orange-500/20",
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const data = await api.getEvents()
        setEvents(data)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching events:", err)
        setError(err instanceof Error ? err.message : "Failed to load events")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const newEvent = await api.createEvent({
        name: formData.get("name") as string,
        event_date: formData.get("date") as string,
        space: formData.get("location") as string,
        expected_guests: Number(formData.get("attendees")),
        status: "confirmed",
        contact_email: formData.get("contactEmail") as string,
        contact_phone: formData.get("contactPhone") as string,
        notes: formData.get("notes") as string,
      })

      setEvents([...events, newEvent])
      setIsAddDialogOpen(false)
    } catch (err) {
      console.error("[v0] Error creating event:", err)
      alert("Failed to create event: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const filteredEvents = (status?: string) => {
    return events.filter((event) => !status || event.status.toLowerCase() === status.toLowerCase())
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <h3 className="text-lg font-semibold">Error Loading Events</h3>
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
          <h1 className="text-3xl font-bold tracking-tight">Events & Operations</h1>
          <p className="text-muted-foreground">Manage hotel events and special occasions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAddEvent}>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>Schedule a new event or operation</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input id="name" name="name" placeholder="Tech Conference 2025" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="attendees">Expected Attendees</Label>
                    <Input id="attendees" name="attendees" type="number" placeholder="50" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location/Space</Label>
                  <Input id="location" name="location" placeholder="Conference Hall A" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" name="contactEmail" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" name="contactPhone" placeholder="+1 234 567 8900" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Special requirements..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {events.filter((e) => e.status === "confirmed").length} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter((e) => e.status === "confirmed").length}</div>
            <p className="text-xs text-muted-foreground">Active events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.reduce((sum, e) => sum + (e.expected_guests || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Expected guests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter((e) => e.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="tentative">Tentative</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <EventsList events={filteredEvents()} onSelectEvent={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <EventsList events={filteredEvents("confirmed")} onSelectEvent={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="tentative" className="space-y-4">
          <EventsList events={filteredEvents("tentative")} onSelectEvent={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <EventsList events={filteredEvents("completed")} onSelectEvent={setSelectedEvent} />
        </TabsContent>
      </Tabs>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent.name}</DialogTitle>
              <DialogDescription>Event ID: {selectedEvent.id}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Event Details</Label>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Attendees:</span> {selectedEvent.expected_guests}
                    </p>
                    <Badge
                      variant="outline"
                      className={statusColors[selectedEvent.status.toLowerCase()] || statusColors.upcoming}
                    >
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Contact</Label>
                  <div className="space-y-2">
                    {selectedEvent.contact_email && <p className="text-sm">{selectedEvent.contact_email}</p>}
                    {selectedEvent.contact_phone && <p className="text-sm">{selectedEvent.contact_phone}</p>}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Schedule</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{new Date(selectedEvent.event_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Location</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{selectedEvent.space}</span>
                  </div>
                </div>
              </div>
              {selectedEvent.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function EventsList({
  events,
  onSelectEvent,
}: {
  events: Event[]
  onSelectEvent: (event: Event) => void
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No events found</h3>
          <p className="text-sm text-muted-foreground">Create a new event to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <Card
          key={event.id}
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onSelectEvent(event)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <Badge
                        variant="outline"
                        className={statusColors[event.status.toLowerCase()] || statusColors.upcoming}
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Event ID: {event.id}</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" />
                    <span className="text-sm font-medium">{event.expected_guests} attendees</span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{new Date(event.event_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{event.space}</p>
                    </div>
                  </div>
                  {event.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">{event.contact_phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {event.notes && (
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Note:</span> {event.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
