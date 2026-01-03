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
// import { useToast } from "@/components/ui/use-toast" // Assuming useToast is available via hooks or context, but usually it's from a provider.
// Given previous file view didn't show useToast in imports, and I saw use-toast.ts in components/ui.
import { useToast } from "@/hooks/use-toast" // Shadcn UI standard path usually, looking at file list it was in components/ui/use-toast.ts so alias might be different. 
// Actually list_dir showed use-toast.ts in components/ui. Let's try importing from there or @/components/ui/use-toast

import { api } from "@/lib/api"

export default function SettingsPage() {
  const { settings, updateSettings, t } = useSettings()
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
      // Assuming api.updateUserPassword takes logic to handle headers
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
                onValueChange={(value) => setLocalSettings({ ...localSettings, language: value as any })}
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

        <div className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>Configure session timeout and security</CardDescription>
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
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordMessage && (
              <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                {passwordMessage.text}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePasswordUpdate} disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>

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
