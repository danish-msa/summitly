"use client";
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Nav from './Nav'
import MobileNav from './MobileNav'
import MobileBottomNav from './MobileBottomNav'

const ResponsiveNav = () => {
    const pathname = usePathname()
    const isDashboardPage = pathname?.startsWith('/dashboard')
    
    const [showNav, setShowNav] = useState(false)
    const openNavHandler = () => setShowNav(true)
    const closeNavHandler = () => setShowNav(false)

    // Hide navbar on dashboard pages
    if (isDashboardPage) {
        return null
    }

  return (
    <div>
        <Nav openNav={openNavHandler} />
        <MobileNav showNav={showNav} closeNav={closeNavHandler} />
        <MobileBottomNav openNav={openNavHandler} />
    </div >
  )
}

export default ResponsiveNav