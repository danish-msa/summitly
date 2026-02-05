"use client";
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Nav from './Nav'
import MobileNav from './MobileNav'
import MobileBottomNav from './MobileBottomNav'

const ResponsiveNav = () => {
    const pathname = usePathname()
    const isDashboardPage = pathname?.startsWith('/dashboard')
    const isRentalsPage = pathname?.startsWith('/manage-rentals')

    const [showNav, setShowNav] = useState(false)
    const openNavHandler = () => setShowNav(true)
    const closeNavHandler = () => setShowNav(false)

    // Hide main navbar on dashboard pages (dashboard has its own sidebar)
    if (isDashboardPage) {
        return null
    }

    // Hide main navbar on rentals pages (manage-rentals layout has its own RentalsNavbar)
    if (isRentalsPage) {
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