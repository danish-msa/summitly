"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  LayoutDashboard,
  MessageSquare,
  Heart,
  Bell,
  TrendingUp,
  Home as HomeIcon,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
  Building2,
  Users,
  Shield,
  Briefcase,
  ChevronRight,
  Plus,
  List,
  Tag,
  Calendar as CalendarIcon,
  MapPin,
  FolderTree,
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
import { isAdmin, isSuperAdmin } from "@/lib/roles"

// Menu item types
type MenuItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  hasSubmenu?: boolean
  submenu?: Array<{
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

// Subscriber menu items (excluding Dashboard which is handled separately)
const subscriberMenuItems: MenuItem[] = [
  { title: "Chat", url: "/dashboard/chat", icon: MessageSquare },
  { title: "Saved", url: "/dashboard/saved", icon: Heart },
  { title: "Alerts", url: "/dashboard/alerts", icon: Bell },
  { title: "My Property Value", url: "/dashboard/property-value", icon: TrendingUp },
  { title: "My Home", url: "/dashboard/my-home", icon: HomeIcon },
  { title: "Assignments", url: "/dashboard/assignments", icon: HomeIcon },
  { title: "Tours & Appointments", url: "/dashboard/tours", icon: Calendar },
  { title: "Market Reports", url: "/dashboard/market-reports", icon: FileText },
]

// Pre-Constructions menu item
const preConstructionsMenuItem: MenuItem = {
  title: "Pre-Con", 
  url: "/dashboard/admin/pre-con-projects", 
  icon: Building2,
  hasSubmenu: true,
  submenu: [
    { title: "All Projects", url: "/dashboard/admin/pre-con-projects", icon: List },
    { title: "Add New Project", url: "/dashboard/admin/pre-con-projects/new", icon: Plus },
    { title: "by Property Type", url: "/dashboard/admin/pre-con-projects/by-property-type", icon: Tag },
    { title: "by Selling Status", url: "/dashboard/admin/pre-con-projects/by-selling-status", icon: Tag },
    { title: "by Completion Year", url: "/dashboard/admin/pre-con-projects/by-completion-year", icon: CalendarIcon },
    { title: "by Location", url: "/dashboard/admin/pre-con-projects/by-location", icon: MapPin },
    { title: "Development Team", url: "/dashboard/admin/development-team", icon: Briefcase },
  ]
}

// Pages menu item
const pagesMenuItem: MenuItem = {
  title: "Pages",
  url: "/dashboard/admin/pages",
  icon: FileText,
  hasSubmenu: true,
  submenu: [
    { title: "All Pages", url: "/dashboard/admin/pages", icon: List },
    { title: "Add New Page", url: "/dashboard/admin/pages/new", icon: Plus },
    { title: "Categories", url: "/dashboard/admin/pages/categories", icon: FolderTree },
  ]
}

// Admin menu items (Dashboard first, then Pre-Constructions, then Pages, then subscriber items)
const adminMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  preConstructionsMenuItem,
  pagesMenuItem,
  ...subscriberMenuItems,
]

// Super Admin menu items (includes admin items + super admin items)
const superAdminMenuItems: MenuItem[] = [
  ...adminMenuItems,
  { title: "User Management", url: "/dashboard/admin/users", icon: Users },
  { title: "Role Management", url: "/dashboard/admin/roles", icon: Shield },
]

const settingsItems = [
  { title: "Notification Preferences", url: "/dashboard/notifications", icon: Bell },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const { open } = useSidebar()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuItemRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  // Update submenu position when opened
  useEffect(() => {
    if (openSubmenu && menuItemRefs.current[openSubmenu]) {
      const rect = menuItemRefs.current[openSubmenu]?.getBoundingClientRect()
      if (rect) {
        setSubmenuPosition({
          top: rect.top,
          left: open ? rect.right + 8 : rect.right + 8,
        })
      }
    } else {
      setSubmenuPosition(null)
    }
  }, [openSubmenu, open])

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const menuItem = menuItemRefs.current[openSubmenu || '']
      const submenu = document.querySelector(`[data-submenu-for="${openSubmenu}"]`)
      
      if (
        openSubmenu &&
        menuItem &&
        !menuItem.contains(target) &&
        submenu &&
        !submenu.contains(target)
      ) {
        setOpenSubmenu(null)
      }
    }

    if (openSubmenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [openSubmenu])

  const toggleSubmenu = (itemTitle: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      setOpenSubmenu(openSubmenu === itemTitle ? null : itemTitle)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const userInitials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  // Get menu items based on user role
  const getMenuItems = () => {
    const role = session?.user?.role
    if (isSuperAdmin(role)) {
      return superAdminMenuItems
    } else if (isAdmin(role)) {
      return adminMenuItems
    }
    return subscriberMenuItems
  }

  const menuItems = getMenuItems()

  return (
    <Sidebar className={!open ? "w-18 bg-white" : "w-64 bg-white flex flex-col"} collapsible="icon">
      {/* Fixed Header */}
      <SidebarHeader className="border-b border-border flex-shrink-0">
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
              {session?.user?.role && (
                <p className="text-xs text-primary font-medium mt-0.5">
                  {session.user.role.replace('_', ' ')}
                </p>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Fixed Go Back Button */}
      <div className="px-2 py-2 border-b border-border flex-shrink-0">
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

      {/* Scrollable Content Area */}
      <SidebarContent className="flex-1 overflow-hidden flex flex-col">
        {/* Scrollable Main Menu */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
          <SidebarGroup>
            <SidebarGroupLabel className={!open ? "sr-only" : ""}>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const hasSubmenu = 'hasSubmenu' in item && item.hasSubmenu && open
                  const isSubmenuOpen = openSubmenu === item.title
                  
                  return (
                    <SidebarMenuItem 
                      key={item.title}
                      ref={(el) => {
                        menuItemRefs.current[item.title] = el
                      }}
                      className="relative"
                    >
                      <SidebarMenuButton asChild>
                        <div className="w-full flex items-center">
                          <Link
                            href={item.url}
                            className={cn(
                              "flex-1 flex items-center gap-2 hover:bg-sidebar-accent rounded-md",
                              isActive(item.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                            onClick={(e) => {
                              if (hasSubmenu) {
                                e.preventDefault()
                                toggleSubmenu(item.title, hasSubmenu)
                              }
                            }}
                          >
                            <item.icon className="h-6 w-6" />
                            {open && <span>{item.title}</span>}
                          </Link>
                          {hasSubmenu && open && (
                            <button
                              onClick={() => toggleSubmenu(item.title, hasSubmenu)}
                              className="p-2 hover:bg-sidebar-accent rounded-md transition-transform"
                              aria-label="Toggle submenu"
                            >
                              <ChevronRight className={cn(
                                "h-4 w-4 transition-transform",
                                isSubmenuOpen && "transform rotate-90"
                              )} />
                            </button>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
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
        </div>
      </SidebarContent>
      
      {/* Submenu Portal - Rendered outside sidebar to avoid overflow clipping */}
      {typeof window !== 'undefined' && openSubmenu && open && submenuPosition && (() => {
        const menuItem = menuItems.find(item => item.title === openSubmenu && item.hasSubmenu && item.submenu)
        if (!menuItem || !menuItem.submenu) return null
        
        return createPortal(
          <div 
            data-submenu-for={openSubmenu}
            className="fixed w-56 bg-white border border-border rounded-lg shadow-lg z-[100] py-1"
            style={{
              left: `${submenuPosition.left}px`,
              top: `${submenuPosition.top}px`,
            }}
          >
            {menuItem.submenu.map((subItem) => (
              <Link
                key={subItem.title}
                href={subItem.url}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent text-sm transition-colors",
                  isActive(subItem.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}
                onClick={() => setOpenSubmenu(null)}
              >
                <subItem.icon className="h-4 w-4" />
                <span>{subItem.title}</span>
              </Link>
            ))}
          </div>,
          document.body
        )
      })()}
    </Sidebar>
  )
}

