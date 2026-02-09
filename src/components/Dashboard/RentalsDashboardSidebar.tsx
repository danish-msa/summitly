"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Plus,
  Users,
  MessageSquare,
  CreditCard,
  Bell,
  ArrowLeft,
  LogOut,
  ClipboardList,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const RENTALS_MENU_ITEMS = [
  { title: "Properties", url: "/manage-rentals/dashboard/properties", icon: Building2 },
  { title: "Add a property", url: "/manage-rentals/dashboard/properties/new", icon: Plus },
  { title: "Applications", url: "/manage-rentals/dashboard/applications", icon: ClipboardList },
  { title: "Leads", url: "/manage-rentals/dashboard/leads", icon: Users },
  { title: "Messages", url: "/manage-rentals/dashboard/messages", icon: MessageSquare },
  { title: "Payments", url: "/manage-rentals/dashboard/payments", icon: CreditCard },
  { title: "Alerts", url: "/manage-rentals/dashboard/alerts", icon: Bell },
]

export function RentalsDashboardSidebar() {
  const { open } = useSidebar()
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/")

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/manage-rentals" })
  }

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <Sidebar
      className={!open ? "w-18 bg-white" : "w-64 bg-white flex flex-col"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage
              src={session?.user?.image || undefined}
              alt={session?.user?.name || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || ""}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <div className="px-2 py-2 border-b border-border flex-shrink-0">
        <SidebarMenuButton asChild>
          <Link href="/manage-rentals" className="w-full bg-secondary hover:bg-primary text-white">
            <ArrowLeft className="h-6 w-6" />
            {open && <span>Back to Rentals</span>}
          </Link>
        </SidebarMenuButton>
      </div>

      <SidebarContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
          <SidebarGroup>
            <SidebarGroupLabel className={!open ? "sr-only" : ""}>
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {RENTALS_MENU_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          "hover:bg-sidebar-accent",
                          isActive(item.url) &&
                            "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
