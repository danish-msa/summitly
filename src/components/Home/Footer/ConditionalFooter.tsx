"use client"

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  const isDashboardPage = pathname?.startsWith('/dashboard')
  
  // Hide footer on dashboard pages
  if (isDashboardPage) {
    return null
  }

  return <Footer />
}

