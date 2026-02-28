"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Settings, Globe, Save, CheckCircle2, Shield, Lock } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Database } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/routing"
import { LocaleConfig } from "@/i18n/config"
import { useCurrency } from "@/hooks/use-currency"

interface SettingsFormProps {
    availableLocales: LocaleConfig[]
}

export default function SettingsForm({ availableLocales }: SettingsFormProps) {
    const { settings, updateSettings } = useSettings()
    const { lastRefreshed } = useCurrency()
    const t = useTranslations("Settings")
    const locale = useLocale()
    const commonT = useTranslations("Common")
    const router = useRouter()
    const pathname = usePathname()
    const [localSettings, setLocalSettings] = useState({
        ...settings,
        autoLogoutTimeout: settings.autoLogoutTimeout || 30
    })
    const [saved, setSaved] = useState(false)

    // Password Change State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [importLoading, setImportLoading] = useState(false)
    const [customCurrency, setCustomCurrency] = useState("")
    const [customCurrencyLoading, setCustomCurrencyLoading] = useState(false)
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(["USD", "EUR", "CZK", "GBP"])

    useEffect(() => {
        setLocalSettings({
            ...settings,
            autoLogoutTimeout: settings.autoLogoutTimeout ?? 30
        })
    }, [settings])

    const handleSave = () => {
        updateSettings(localSettings)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)

        // Switch locale if changed
        if (localSettings.language !== settings.language) {
            router.replace(pathname, { locale: localSettings.language });
        }
    }

    const handlePasswordUpdate = async () => {
        setPasswordMessage(null)
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: "New passwords do not match" })
            return
        }
        if (!passwordForm.currentPassword) {
            setPasswordMessage({ type: 'error', text: "Current password is required" })
            return
        }

        setPasswordLoading(true)
        try {
            await api.updateUserPassword({
                current_password: passwordForm.currentPassword,
                new_password: passwordForm.newPassword
            })
            setPasswordMessage({ type: 'success', text: "Password updated successfully" })
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message || "Failed to update password" })
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleImportData = async () => {
        if (!confirm("This will import example data. Existing data with same IDs/emails will be skipped.")) return

        setImportLoading(true)
        try {
            await api.importData()
            toast.success("Data imported successfully")
        } catch (err: any) {
            toast.error("Failed to import data: " + (err.message || "Unknown error"))
        } finally {
            setImportLoading(false)
        }
    }

    const handleAddCustomCurrency = async () => {
        if (!customCurrency || customCurrency.length !== 3) {
            toast.error(t("currencyCodeInvalid"))
            return
        }

        setCustomCurrencyLoading(true)
        try {
            const res = await api.addExchangeRate(customCurrency.toUpperCase())
            toast.success(t("currencyTrackSuccess", { currency: customCurrency.toUpperCase() }))
            setAvailableCurrencies(prev => {
                if (!prev.includes(customCurrency.toUpperCase())) {
                    return [...prev, customCurrency.toUpperCase()]
                }
                return prev
            })
            // Update the form setting directly
            setLocalSettings(prev => ({ ...prev, currency: customCurrency.toUpperCase() }))
            setCustomCurrency("")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setCustomCurrencyLoading(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
                    <p className="text-muted-foreground">{t("configureSystem")}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="size-5 text-primary" />
                            <CardTitle>{t("regionalSettings")}</CardTitle>
                        </div>
                        <CardDescription>{t("basicInfo")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="language">{t("language")}</Label>
                            <Select
                                value={localSettings.language}
                                onValueChange={(value) => setLocalSettings({ ...localSettings, language: value as any })}
                            >
                                <SelectTrigger id="language">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableLocales.map((locale) => (
                                        <SelectItem key={locale.code} value={locale.code}>
                                            {locale.flag ? `${locale.flag} ` : ''}{locale.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="currency">{t("currency")}</Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={localSettings.currency}
                                    onValueChange={(value) => setLocalSettings({ ...localSettings, currency: value })}
                                >
                                    <SelectTrigger id="currency" className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCurrencies.map(c => {
                                            let label = c;
                                            if (c === "USD") label = "USD ($)";
                                            if (c === "EUR") label = "EUR (€)";
                                            if (c === "CZK") label = "CZK (Kč)";
                                            if (c === "GBP") label = "GBP (£)";
                                            return <SelectItem key={c} value={c}>{label}</SelectItem>;
                                        })}
                                        {/* If a custom currency is chosen but not in the default list, show it */}
                                        {!availableCurrencies.includes(localSettings.currency) && (
                                            <SelectItem value={localSettings.currency}>{localSettings.currency}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {lastRefreshed && (
                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                    {t("lastRefreshed")}: {new Intl.DateTimeFormat(locale, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    }).format(new Date(lastRefreshed))}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2 border rounded-md p-3 bg-muted/30">
                            <Label htmlFor="customCurrency" className="text-sm font-semibold">{t("trackNewCurrency")}</Label>
                            <p className="text-xs text-muted-foreground">{t("trackNewCurrencyDesc")}</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="customCurrency"
                                    className="uppercase flex-1"
                                    placeholder={t("currencyCodeExp")}
                                    maxLength={3}
                                    value={customCurrency}
                                    onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                                />
                                <Button size="sm" variant="secondary" onClick={handleAddCustomCurrency} disabled={customCurrencyLoading}>
                                    {customCurrencyLoading ? commonT("loading") : commonT("add")}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dateFormat">{t("dateFormat")}</Label>
                            <Select
                                value={localSettings.dateFormat}
                                onValueChange={(value) => setLocalSettings({ ...localSettings, dateFormat: value })}
                            >
                                <SelectTrigger id="dateFormat">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="timeFormat">{t("timeFormat")}</Label>
                            <Select
                                value={localSettings.timeFormat}
                                onValueChange={(value) => setLocalSettings({ ...localSettings, timeFormat: value })}
                            >
                                <SelectTrigger id="timeFormat">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                                    <SelectItem value="24h">24-hour</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Settings className="size-5 text-primary" />
                                <CardTitle>{t("hotelInformation")}</CardTitle>
                            </div>
                            <CardDescription>{t("basicInfo")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="hotelName">{t("hotelName")}</Label>
                                <Input
                                    id="hotelName"
                                    placeholder="Zámek Berštejn Hotel"
                                    value={localSettings.hotelName}
                                    onChange={(e) => setLocalSettings({ ...localSettings, hotelName: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="size-5 text-primary" />
                                <CardTitle>{t("securitySettings")}</CardTitle>
                            </div>
                            <CardDescription>{t("securityDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="auto-logout" className="flex flex-col space-y-1">
                                    <span>Auto Logout</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Automatically log out after inactivity
                                    </span>
                                </Label>
                                <Switch
                                    id="auto-logout"
                                    checked={localSettings.autoLogoutEnabled}
                                    onCheckedChange={(checked) => setLocalSettings({ ...localSettings, autoLogoutEnabled: checked })}
                                />
                            </div>
                            {localSettings.autoLogoutEnabled && (
                                <div className="grid gap-2">
                                    <Label htmlFor="timeout">Timeout (minutes)</Label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        min="1"
                                        value={localSettings.autoLogoutTimeout ?? 30}
                                        onChange={(e) => setLocalSettings({ ...localSettings, autoLogoutTimeout: parseInt(e.target.value) || 15 })}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="size-5 text-primary" />
                            <CardTitle>{t("changePassword")}</CardTitle>
                        </div>
                        <CardDescription>{t("updateAccountPassword")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {passwordMessage && (
                            <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">{t("currentPassword")}</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">{t("newPassword")}</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handlePasswordUpdate} disabled={passwordLoading}>
                                {passwordLoading ? commonT("loading") : t("updatePassword")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("apiConfiguration")}</CardTitle>
                        <CardDescription>{t("apiInfo")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t("connectionType")}</Label>
                                <p className="text-sm font-mono">Server Proxy</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t("version")}</Label>
                                <p className="text-sm">2.0.0</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t("status")}</Label>
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-green-500" />
                                    <span className="text-sm">{t("active")}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="size-5 text-primary" />
                            <CardTitle>{t("systemManagement")}</CardTitle>
                        </div>
                        <CardDescription>{t("manageSystem")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("importExampleData")}</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("populateData")}
                            </p>
                            <Button onClick={handleImportData} disabled={importLoading} variant="outline">
                                {importLoading ? "Importing..." : t("importSampleData")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} className="gap-2" disabled={saved}>
                    {saved ? (
                        <>
                            <CheckCircle2 className="size-4" />
                            {t("settingsSaved")}
                        </>
                    ) : (
                        <>
                            <Save className="size-4" />
                            {t("saveSettings")}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
