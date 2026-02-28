"use client"
import { Calendar, DoorOpen, Home, BarChart3, CalendarDays, Settings, Users, LogOut, FileText, ConciergeBell, Percent, Sparkles } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslations } from "next-intl"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const t = useTranslations("Navigation")
  const { logout } = useAuth()

  const navItems = [
    {
      title: t("dashboard"),
      url: "/dashboard",
      icon: Home,
    },
    {
      title: t("rooms"),
      url: "/dashboard/rooms",
      icon: DoorOpen,
    },
    {
      title: t("bookings"),
      url: "/dashboard/bookings",
      icon: Calendar,
    },
    {
      title: t("calendar"),
      url: "/dashboard/calendar",
      icon: CalendarDays,
    },
    {
      title: t("auditLogs"),
      url: "/dashboard/audit-logs",
      icon: FileText,
    },
    {
      title: t("services"),
      url: "/dashboard/services",
      icon: ConciergeBell,
    },
    {
      title: t("clients") || "Clients",
      url: "/dashboard/clients",
      icon: Users,
    },
    {
      title: t("rates"),
      url: "/dashboard/rates",
      icon: Percent,
    },
    {
      title: t("housekeeping"),
      url: "/dashboard/housekeeping",
      icon: Sparkles,
    },
    {
      title: t("reports"),
      url: "/dashboard/reports",
      icon: BarChart3,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <DoorOpen className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{t("minihotel")}</span>
            <span className="text-xs text-muted-foreground">{t("management")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/settings">
                <Settings className="size-4" />
                <span>{t("settings")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logout()}>
              <LogOut className="size-4" />
              <span>{t("logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
