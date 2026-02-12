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
import { ConciergeBell, Plus, Search, DollarSign } from "lucide-react"
import { api } from "@/lib/api"
import { useTranslations, useFormatter } from "next-intl"
import { useCurrency } from "@/hooks/use-currency"

interface Service {
    id: number
    name: string
    description?: string
    price: number
    is_active: boolean
}

export default function ServicesPage() {
    const t = useTranslations("Services")
    const format = useFormatter()
    const { convert, convertToBase, currency } = useCurrency()
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    useEffect(() => {
        async function fetchServices() {
            try {
                setLoading(true)
                const data = await api.getServices()
                setServices(data)
                setError(null)
            } catch (err) {
                console.error("Error fetching services:", err)
                setError(err instanceof Error ? err.message : "Failed to load services")
            } finally {
                setLoading(false)
            }
        }

        fetchServices()
    }, [])

    const filteredServices = services.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        try {
            const inputPrice = Number(formData.get("price"))
            const basePrice = convertToBase(inputPrice)

            const newService = await api.createService({
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                price: basePrice,
            })

            setServices([...services, newService])
            setIsAddDialogOpen(false)
            toast.success(t("serviceCreated"))
        } catch (err) {
            console.error("Error creating service:", err)
            toast.error("Failed to create service: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="mt-4 text-muted-foreground">{t("loadingServices")}</p>
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
                        <Button>
                            <Plus className="mr-2 size-4" />
                            {t("addService")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddService}>
                            <DialogHeader>
                                <DialogTitle>{t("addService")}</DialogTitle>
                                <DialogDescription>{t("addServiceDescription")}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">{t("serviceName")}</Label>
                                    <Input id="name" name="name" placeholder={t("serviceNamePlaceholder")} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">{t("price")} ({currency})</Label>
                                    <Input id="price" name="price" type="number" placeholder="0.00" step="0.01" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">{t("description")}</Label>
                                    <Textarea id="description" name="description" placeholder={t("descriptionPlaceholder")} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{t("createService")}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("filters")}</CardTitle>
                    <CardDescription>{t("searchServices")}</CardDescription>
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
                {filteredServices.map((service) => (
                    <Card key={service.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                        <ConciergeBell className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{service.name}</CardTitle>
                                        <p className="text-2xl font-bold">
                                            {format.number(convert(service.price), { style: 'currency', currency: currency })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{service.description || t("noDescription")}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredServices.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ConciergeBell className="size-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">{t("noServicesFound")}</h3>
                        <p className="text-sm text-muted-foreground">{t("tryAdjustingSearch")}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
