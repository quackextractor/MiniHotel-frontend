"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Globe, Save, CheckCircle2 } from "lucide-react"
import { useSettings } from "@/lib/settings-context"

export default function SettingsPage() {
  const { settings, updateSettings, t } = useSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    updateSettings(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
          <p className="text-muted-foreground">Configure your hotel management system</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              <CardTitle>{t("regionalSettings")}</CardTitle>
            </div>
            <CardDescription>Configure language, currency, and date/time formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="language">{t("language")}</Label>
              <Select
                value={localSettings.language}
                onValueChange={(value) => setLocalSettings({ ...localSettings, language: value })}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="cs">Čeština (Czech)</SelectItem>
                  <SelectItem value="de">Deutsch (German)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <Select
                value={localSettings.currency}
                onValueChange={(value) => setLocalSettings({ ...localSettings, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="CZK">CZK (Kč)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              <CardTitle>{t("hotelInformation")}</CardTitle>
            </div>
            <CardDescription>Basic information about your property</CardDescription>
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

            <div className="grid gap-2">
              <Label htmlFor="apiUrl">API Connection</Label>
              <Input id="apiUrl" value="Via Next.js Server Proxy" disabled />
              <p className="text-xs text-muted-foreground">
                API requests are proxied through the Next.js server for network compatibility
              </p>
            </div>

            <div className="grid gap-2">
              <Label>System Status</Label>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <div className="size-2 rounded-full bg-green-500" />
                <span className="text-sm">Connected to API</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Information about your API connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Connection Type</Label>
              <p className="text-sm font-mono">Server Proxy</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Version</Label>
              <p className="text-sm">2.0.0</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                <span className="text-sm">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
