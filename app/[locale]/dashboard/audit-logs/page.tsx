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
export default function AuditLogsPage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <Card>

                <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>IP Address</TableHead>
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
                                    <TableCell colSpan={6} className="text-center">No logs found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
