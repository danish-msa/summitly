"use client";
import { navLinks } from '@/lib/constants/navigation';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { HiBars3BottomRight } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '@/components/Auth/AuthModal';
// import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Props = {
  openNav: () => void;
};

const Nav = ({ openNav }: Props) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(false);

  const handleDropdownToggle = (id: number) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleSidePanelToggle = () => {
    setShowSidePanel(!showSidePanel);
  };

  const handleSidePanelClose = () => {
    setShowSidePanel(false);
  };

  // Scroll detection for navbar background only
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 50);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    controlNavbar(); // Check initial position
    
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  // Update body padding based on navbar state
  useEffect(() => {
    if (isAtTop) {
      document.body.style.paddingTop = '0';
    } else {
      document.body.style.paddingTop = '4rem';
    }
    
    return () => {
      document.body.style.paddingTop = '0';
    };
  }, [isAtTop]);

  // Handle ESC key to close side panel and prevent body scroll
  useEffect(() => {
    if (showSidePanel) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowSidePanel(false);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showSidePanel]);

  const getSubLinkIcon = (label: string) => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('buy')) return '🏠';
    if (labelLower.includes('sell')) return '💰';
    if (labelLower.includes('rent')) return '🔑';
    if (labelLower.includes('map')) return '🗺️';
    if (labelLower.includes('mortgage')) return '📊';
    if (labelLower.includes('calculator')) return '🧮';
    if (labelLower.includes('agent')) return '👤';
    if (labelLower.includes('about')) return 'ℹ️';
    if (labelLower.includes('contact')) return '📞';
    if (labelLower.includes('blog')) return '📝';
    if (labelLower.includes('faq')) return '❓';
    return '📋';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
        className={cn(
          "fixed w-full top-0 left-0 right-0 z-[9999] transition-all duration-300",
          isAtTop 
            ? "bg-transparent backdrop-blur-none shadow-none border-transparent" 
            : "bg-background/95 backdrop-blur-sm border-b border-border/40"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Left Side: Logo + Buy, Rent, Mortgage */}
            <div className="flex items-center space-x-4 lg:space-x-6">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Link href="/" className="flex items-center group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="relative"
                  >
                    <Image
                      src="/images/logo/LogoBlue.png"
                      alt="Summitly Logo"
                      width={200}
                      height={60}
                      className="h-8 lg:h-10 w-auto transition-opacity duration-300"
                      priority
                      quality={100}
                    />
                  </motion.div>
                </Link>
              </motion.div>

              {/* Buy, Rent, Mortgage - Desktop Only */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link href="/buy">
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Buy
                  </motion.div>
                </Link>
                <Link href="/rent">
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Rent
                  </motion.div>
                </Link>
                <Link href="/calculators">
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    Mortgage
                  </motion.div>
                </Link>
              </nav>
            </div>

            {/* Right Side: Listings, Map Search, Login, Side Panel Button */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Listings - Desktop Only */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="hidden lg:block"
              >
                <Link href="/listings">
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Listings
                  </motion.div>
                </Link>
              </motion.div>

              {/* Map Search - Desktop Only */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="hidden lg:block"
              >
                <Link href="/map-search">
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Map Search
                  </motion.div>
                </Link>
              </motion.div>

              {/* Login / Signup Button */}
              <motion.button
                onClick={handleLoginClick}
                className="flex items-center space-x-2 px-3 py-2 text-sm lg:text-base font-medium bg-brand-cb-blue text-white hover:bg-brand-midnight transition-colors rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <FaUserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Login / Signup</span>
                <span className="sm:hidden">Login</span>
              </motion.button>

              {/* Side Panel Menu Button - Desktop Only */}
              <motion.button
                onClick={handleSidePanelToggle}
                className="hidden lg:flex p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <HiBars3BottomRight className="w-6 h-6" />
              </motion.button>

              {/* Mobile Menu Button (for original mobile nav) */}
              <motion.button
                onClick={openNav}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <HiBars3BottomRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Side Panel */}
      <AnimatePresence>
        {showSidePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={handleSidePanelClose}
            />
            
            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h2 className="text-2xl font-bold">Menu</h2>
                  <motion.button
                    onClick={handleSidePanelClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  {/* Show all nav links except Listings and Map Search */}
                  {navLinks
                    .filter(link => link.label !== 'Listings' && link.label !== 'Map Search')
                    .map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        {link.subLinks ? (
                          <div className="mb-4">
                            {/* Show section title except for "Buy & Sell" since we already have Buy/Rent in navbar */}
                            {link.label !== 'Buy & Sell' && (
                              <h3 className="text-lg font-semibold mb-2 text-gray-800 px-2">
                                {link.label}
                              </h3>
                            )}
                            <div className="space-y-1">
                              {link.subLinks.map((subLink) => (
                                <Link
                                  key={subLink.id}
                                  href={subLink.url}
                                  onClick={handleSidePanelClose}
                                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-foreground hover:bg-brand-tide rounded-lg transition-colors group"
                                >
                                  <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg text-lg group-hover:bg-brand-tide group-hover:text-primary-foreground transition-colors">
                                    {getSubLinkIcon(subLink.label)}
                                  </div>
                                  <span>{subLink.label}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={link.url}
                            onClick={handleSidePanelClose}
                            className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-foreground hover:bg-brand-tide rounded-lg transition-colors group"
                          >
                            <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg text-lg group-hover:bg-brand-tide group-hover:text-primary-foreground transition-colors">
                              {getSubLinkIcon(link.label)}
                            </div>
                            <span>{link.label}</span>
                          </Link>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Nav;