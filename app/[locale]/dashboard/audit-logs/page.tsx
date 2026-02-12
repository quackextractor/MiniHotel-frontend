"use client"

import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useTranslations } from "next-intl"

export default function AuditLogsPage() {
    const t = useTranslations("AuditLogs")
    const commonT = useTranslations("Common")
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchLogs() {
            try {
                const data = await api.getAuditLogs()
                setLogs(data)
            } catch (error) {
                console.error("Failed to fetch audit logs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <Card>

                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("id")}</TableHead>
                                <TableHead>{t("user")}</TableHead>
                                <TableHead>{t("action")}</TableHead>
                                <TableHead>{t("details")}</TableHead>
                                <TableHead>{t("timestamp")}</TableHead>
                                <TableHead>{t("ipAddress")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.id}</TableCell>
                                    <TableCell>{log.user?.username || log.user_id}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell>{log.details}</TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{log.ip_address}</TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">{t("noLogs")}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
