import { getLocales } from "@/i18n/config"
import SettingsForm from "./settings-form"

// This is a Server Component
export default function SettingsPage() {
  // Fetch locales on the server side (fs)
  const availableLocales = getLocales()

  return <SettingsForm availableLocales={availableLocales} />
}
