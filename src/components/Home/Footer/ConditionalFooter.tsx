"use client"

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const isAiPage = pathname === '/ai' || pathname?.startsWith('/ai/')
  
  // Hide footer on dashboard + AI pages
  if (isDashboardPage || isAiPage) {
    return null
  }

  return <Footer />
}

