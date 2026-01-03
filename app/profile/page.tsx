"use client"

import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, AlertCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from "sonner"

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }).optional().or(z.literal('')),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }).optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal(''))
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false
    }
    return true
}, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function ProfilePage() {
    const { token, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: user?.username || "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)
        try {
            const payload: any = {}
            if (values.username && values.username !== user?.username) payload.username = values.username
            if (values.password) payload.password = values.password

            if (Object.keys(payload).length === 0) {
                return
            }

            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Update failed')
            }

            toast.success("Profile Updated", {
                description: "Your profile has been updated successfully."
            })

            // Update local storage/context if username changed?
            // For simplicity, we might ask user to relogin or update context manually.
            // Ideally AuthContext should expose an 'updateUser' method.

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Admin Profile</CardTitle>
                    <CardDescription>
                        Update your credentials. Leave password blank to keep current one.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            {...form.register("username")}
                        />
                        {form.formState.errors.username && (
                            <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            {...form.register("confirmPassword")}
                        />
                        {form.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Profile
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
