"use client"

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./DashboardSidebar"
import { Loader2 } from 'lucide-react'
import { isAdmin, isSuperAdmin } from '@/lib/roles'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Reset body padding on dashboard pages
  useEffect(() => {
    document.body.style.paddingTop = '0'
    return () => {
      document.body.style.paddingTop = '0'
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Role-based access control
    if (status === 'authenticated' && session?.user && pathname) {
      const userRole = session.user.role

      // Admin routes require admin or super admin
      if (pathname.startsWith('/dashboard/admin')) {
        if (!isAdmin(userRole)) {
          router.push('/dashboard')
          return
        }
      }

      // Super admin only routes
      if (pathname.startsWith('/dashboard/admin/users') || 
          pathname.startsWith('/dashboard/admin/roles')) {
        if (!isSuperAdmin(userRole)) {
          router.push('/dashboard')
          return
        }
      }
    }
  }, [status, session, router, pathname])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-muted/30 overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b bg-white flex items-center px-6 flex-shrink-0 z-40">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-semibold text-foreground">
              Welcome, {session?.user?.name}
            </h1>
            {session?.user?.role && (
              <span className="ml-4 text-xs text-muted-foreground">
                ({session.user.role.replace('_', ' ')})
              </span>
            )}
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

