"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  Heart,
  Bell,
  TrendingUp,
  Home,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", url: "/dashboard/chat", icon: MessageSquare },
  { title: "Saved", url: "/dashboard/saved", icon: Heart },
  { title: "Alerts", url: "/dashboard/alerts", icon: Bell },
  { title: "My Property Value", url: "/dashboard/property-value", icon: TrendingUp },
  { title: "Assignments", url: "/dashboard/assignments", icon: Home },
  { title: "Tours & Appointments", url: "/dashboard/tours", icon: Calendar },
  { title: "Market Reports", url: "/dashboard/market-reports", icon: FileText },
]

const settingsItems = [
  { title: "Notification Preferences", url: "/dashboard/notifications", icon: Bell },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const { open } = useSidebar()
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const userInitials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <Sidebar className={!open ? "w-18" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || ''}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Go Back to Website Link */}
        <div className="px-2 py-2 border-b border-border">
          <SidebarMenuButton asChild>
            <Link
              href="/"
              className="w-full bg-secondary hover:bg-primary text-white"
            >
              <ArrowLeft className="h-6 w-6" />
              {open && <span>Go Back to Website</span>}
            </Link>
          </SidebarMenuButton>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : ""}>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "hover:bg-sidebar-accent",
                        isActive(item.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      {open && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : ""}>Preferences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "hover:bg-sidebar-accent",
                        isActive(item.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      {open && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full hover:bg-sidebar-accent text-sidebar-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    {open && <span>Log Out</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

