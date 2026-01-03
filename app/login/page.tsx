"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
})

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [initChecking, setInitChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    })

    useEffect(() => {
        // Check if system is initialized
        async function checkInit() {
            try {
                const res = await fetch('http://localhost:5000/api/auth/status')
                const data = await res.json()
                if (!data.initialized) {
                    router.push('/register')
                }
            } catch (err) {
                console.error("Failed to check init status", err)
            } finally {
                setInitChecking(false)
            }
        }
        checkInit()

        // Check for error in query params
        const errorParam = searchParams.get('error')
        if (errorParam) {
            setError(decodeURIComponent(errorParam))
        }
    }, [router, searchParams])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Login failed')
            }

            // Login successful
            // We need to decode the token or just use the response if it returns user info. My backend returns { token, username }.
            // I need userId though. My backend implementation of login: `return jsonify({'token': token, 'username': user.username})`
            // Wait, I forgot to return userId in the backend login response!
            // I should update backend or decode the token in frontend.
            // The token payload has `user_id`.
            // I'll parse the token payload.

            const payload = JSON.parse(atob(data.token.split('.')[1]))
            const userId = payload.user_id

            login(data.token, data.username, userId)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (initChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the admin dashboard.
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
                            placeholder="admin"
                            {...form.register("username")}
                        />
                        {form.formState.errors.username && (
                            <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign in
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
