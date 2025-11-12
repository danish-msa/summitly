"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./DashboardSidebar"
import { Loader2 } from 'lucide-react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

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

  // Reset body padding on dashboard pages
  useEffect(() => {
    document.body.style.paddingTop = '0'
    return () => {
      document.body.style.paddingTop = '0'
    }
  }, [])

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-muted/30 overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b bg-background flex items-center px-6 flex-shrink-0 z-40">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-semibold text-foreground">Welcome, {session?.user?.name}</h1>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

