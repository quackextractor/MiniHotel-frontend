"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

type AuditResult = {
    locale: string
    missingKeys: string[]
}

export function I18nAudit({ missingTranslations }: { missingTranslations: AuditResult[] }) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (missingTranslations.length > 0 && process.env.NODE_ENV === "development") {
            setOpen(true)
        }
    }, [missingTranslations])

    if (missingTranslations.length === 0) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="size-5" />
                        Translation  Issues Detected
                    </DialogTitle>
                    <DialogDescription>
                        The following translation keys are missing in your language files.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[50vh] pr-4">
                    <div className="space-y-6">
                        {missingTranslations.map((result) => (
                            <div key={result.locale} className="space-y-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <span className="uppercase bg-muted px-2 py-1 rounded text-sm">{result.locale}</span>
                                    <span className="text-muted-foreground text-sm font-normal">
                                        {result.missingKeys.length} missing keys
                                    </span>
                                </h3>
                                <div className="bg-muted/50 rounded-md p-4 space-y-1">
                                    {result.missingKeys.map((key) => (
                                        <div key={key} className="text-sm font-mono text-destructive">
                                            {key}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
