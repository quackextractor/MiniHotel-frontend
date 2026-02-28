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
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, Search, Edit, Trash2, Mail, Phone } from "lucide-react"
import { api } from "@/lib/api"
import { useTranslations } from "next-intl"

interface Guest {
    id: number
    first_name: string
    last_name: string
    email?: string
    phone?: string
    address?: string
}

export default function ClientsPage() {
    const t = useTranslations("Clients")
    const commonT = useTranslations("Common")
    const [guests, setGuests] = useState<Guest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

    useEffect(() => {
        async function fetchGuests() {
            try {
                setLoading(true)
                const data = await api.getGuests()
                setGuests(data)
                setError(null)
            } catch (err) {
                console.error("Error fetching clients:", err)
                setError(err instanceof Error ? err.message : "Failed to load clients")
            } finally {
                setLoading(false)
            }
        }

        fetchGuests()
    }, [])

    const filteredGuests = guests.filter((guest) =>
        `${guest.first_name} ${guest.last_name} ${guest.email || ""} ${guest.phone || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAddGuest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        try {
            const newGuest = await api.createGuest({
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
                address: formData.get("address") as string,
            })

            setGuests([...guests, newGuest])
            setIsAddDialogOpen(false)
            toast.success(t("clientCreated") || "Client created successfully")
        } catch (err) {
            console.error("Error creating client:", err)
            toast.error("Failed to create client: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    const handleEditGuest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedGuest) return
        const formData = new FormData(e.currentTarget)

        try {
            const updatedGuest = await api.updateGuest(selectedGuest.id, {
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
                address: formData.get("address") as string,
            })

            setGuests(guests.map(g => g.id === updatedGuest.id ? updatedGuest : g))
            setIsEditDialogOpen(false)
            setSelectedGuest(null)
            toast.success(t("clientUpdated") || "Client updated successfully")
        } catch (err) {
            console.error("Error updating client:", err)
            toast.error("Failed to update client: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    const handleDeleteGuest = async (id: number) => {
        if (!confirm(t("confirmDelete") || "Are you sure you want to delete this client?")) return
        try {
            await api.deleteGuest(id)
            setGuests(guests.filter(g => g.id !== id))
            toast.success(t("clientDeleted") || "Client deleted successfully")
        } catch (err) {
            console.error("Error deleting client:", err)
            toast.error("Failed to delete client. They might have active bookings.")
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="mt-4 text-muted-foreground">{t("loadingClients") || "Loading clients..."}</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>{t("errorLoading") || "Error Loading Data"}</CardTitle>
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
                    <h1 className="text-3xl font-bold tracking-tight">{t("title") || "Clients"}</h1>
                    <p className="text-muted-foreground">{t("subtitle") || "Manage your hotel clients and guests"}</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            {t("addClient") || "Add Client"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddGuest}>
                            <DialogHeader>
                                <DialogTitle>{t("addClient") || "Add Client"}</DialogTitle>
                                <DialogDescription>{t("addClientDescription") || "Create a new client profile."}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">{t("firstName") || "First Name"}</Label>
                                        <Input id="first_name" name="first_name" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">{t("lastName") || "Last Name"}</Label>
                                        <Input id="last_name" name="last_name" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">{t("email") || "Email"}</Label>
                                        <Input id="email" name="email" type="email" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">{t("phone") || "Phone Number"}</Label>
                                        <Input id="phone" name="phone" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">{t("address") || "Address"}</Label>
                                    <Textarea id="address" name="address" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{t("createClient") || "Create Client"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) setSelectedGuest(null)
                }}>
                    <DialogContent>
                        <form onSubmit={handleEditGuest}>
                            <DialogHeader>
                                <DialogTitle>{t("editClient") || "Edit Client"}</DialogTitle>
                                <DialogDescription>{t("editClientDescription") || "Update the client's information."}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-first_name">{t("firstName") || "First Name"}</Label>
                                        <Input id="edit-first_name" name="first_name" defaultValue={selectedGuest?.first_name} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-last_name">{t("lastName") || "Last Name"}</Label>
                                        <Input id="edit-last_name" name="last_name" defaultValue={selectedGuest?.last_name} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-email">{t("email") || "Email"}</Label>
                                        <Input id="edit-email" name="email" type="email" defaultValue={selectedGuest?.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-phone">{t("phone") || "Phone Number"}</Label>
                                        <Input id="edit-phone" name="phone" defaultValue={selectedGuest?.phone} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-address">{t("address") || "Address"}</Label>
                                    <Textarea id="edit-address" name="address" defaultValue={selectedGuest?.address} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{commonT("save") || "Save Changes"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("filters") || "Filters"}</CardTitle>
                    <CardDescription>{t("searchClients") || "Search through clients by name, email, or phone."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchPlaceholder") || "Search clients..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGuests.map((guest) => (
                    <Card key={guest.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                        <Users className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{guest.first_name} {guest.last_name}</CardTitle>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setSelectedGuest(guest)
                                        setIsEditDialogOpen(true)
                                    }}>
                                        <Edit className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteGuest(guest.id)}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {guest.email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="size-4" />
                                    {guest.email}
                                </div>
                            )}
                            {guest.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="size-4" />
                                    {guest.phone}
                                </div>
                            )}
                            {guest.address && (
                                <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{guest.address}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredGuests.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="size-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">{t("noClientsFound") || "No clients found"}</h3>
                        <p className="text-sm text-muted-foreground">{t("tryAdjustingSearch") || "Try adjusting your search criteria"}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
