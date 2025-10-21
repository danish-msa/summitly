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
import { ButtonColorful } from '@/components/ui/button-colorful';

type Props = {
  openNav: () => void;
};

const Nav = ({ openNav }: Props) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  const handleDropdownToggle = (id: number) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  // Scroll detection for navbar visibility and background
  useEffect(() => {
    let ticking = false;
    
    const controlNavbar = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY);
          
          // Update isAtTop state
          setIsAtTop(currentScrollY < 50);
          
          // Only trigger if scroll difference is significant (prevents flickering)
          if (scrollDifference > 5) {
            // Show navbar when scrolling up or at the top
            if (currentScrollY < lastScrollY || currentScrollY < 100) {
              setIsVisible(true);
            } 
            // Hide navbar when scrolling down (but not at the very top)
            else if (currentScrollY > lastScrollY && currentScrollY > 100) {
              setIsVisible(false);
            }
            
            setLastScrollY(currentScrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

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
    return '📋';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: isVisible ? 0 : -100,
          scale: isVisible ? 1 : 0.95
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
        className={cn(
          "fixed w-full top-0 left-0 right-0 z-[9999] transition-all duration-300",
          isAtTop 
            ? "bg-transparent backdrop-blur-none shadow-none border-transparent" 
            : "bg-background/95 backdrop-blur-sm border-b border-border/40",
          isVisible ? " " : "shadow-none"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
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
                    src="/images/LogoBlue.png"
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

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {link.subLinks ? (
                    <div
                      onMouseEnter={() => handleDropdownToggle(link.id)}
                      onMouseLeave={() => handleDropdownToggle(link.id)}
                      className="relative"
                    >
                      <motion.button
                        className="flex items-center space-x-1 px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>{link.label}</span>
                        <motion.svg
                          className="w-4 h-4"
                          animate={{ rotate: openDropdown === link.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>

                      <AnimatePresence>
                        {openDropdown === link.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-[9999] overflow-hidden"
                          >
                            <div className="p-2">
                              {link.subLinks.map((subLink, subIndex) => (
                                <motion.div
                                  key={subLink.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: subIndex * 0.05 }}
                                >
                                  <Link
                                    href={subLink.url}
                                    className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-foreground hover:bg-brand-tide rounded-lg transition-colors group"
                                  >
                                    <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg text-lg group-hover:bg-bg-brand-tide group-hover:text-primary-foreground transition-colors">
                                      {getSubLinkIcon(subLink.label)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{subLink.label}</div>
                                    </div>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link href={link.url}>
                      <motion.div
                        className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {link.label}
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Phone Number - Desktop Only */}
              <motion.div 
                className="hidden xl:flex items-center space-x-2 text-base text-muted-foreground"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                
              </motion.div>

              {/* Theme Toggle */}
              {/* <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ThemeToggle />
              </motion.div> */}

              {/* Login Button */}
              <motion.button
                onClick={handleLoginClick}
                className="hidden md:flex items-center space-x-2 px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <FaUserCircle className="w-4 h-4" />
                <span>Login</span>
              </motion.button>

              {/* Submit Property Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <ButtonColorful label='Submit Property' href='/submit-property' variant='gradient' />
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={openNav}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <HiBars3BottomRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default Nav;