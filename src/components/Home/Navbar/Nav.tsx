"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { HiBars3BottomRight } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import AuthModal from '@/components/Auth/AuthModal';
import { UserProfileDropdown } from '@/components/common/UserProfileDropdown';
import { useSession } from 'next-auth/react';
// import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutocompleteSearch } from '@/components/common/AutocompleteSearch';
import { BuyMegaMenu } from './BuyMegaMenu';
import { RentMegaMenu } from './RentMegaMenu';
import { ProjectsMegaMenu } from './ProjectsMegaMenu';
import { MoreMegaMenu } from './MoreMegaMenu';
import { AIButton } from '@/components/ui/ai-button';

type Props = {
  openNav: () => void;
};

const Nav = ({ openNav }: Props) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Check if current page is a property detail page (not listing/category pages)
  // Property pages: actual property detail pages, not listing or category pages
  const isPropertyPage = (() => {
    if (!pathname) return false;
    
    // Old property page patterns - only match actual property detail pages
    if (pathname.includes('/property/') && pathname.split('/').length > 2) {
      // /property/{id} format
      return true;
    }
    
    // Pre-construction: only treat as property page if it's a specific project detail page
    // NOT listing pages like /pre-con, /pre-con/toronto, /pre-con/condos
    if (pathname.startsWith('/pre-con/')) {
      const pathParts = pathname.split('/').filter(Boolean);
      
      // If path has more than 2 parts (e.g., /pre-con/[slug]/[unitId]), it's a detail page
      if (pathParts.length > 2) {
        return true; // Detail page (e.g., unit detail) - no sticky navbar
      }
      
      if (pathParts.length === 2) {
        const slug = pathParts[1];
        const slugLower = slug.toLowerCase();
        
        // Known listing/category pages that should have sticky navbar
        const knownCategories = ['condos', 'houses', 'lofts', 'master-planned-communities', 'multi-family', 'offices', 
                               'selling', 'coming-soon', 'sold-out', 'platinum-access', 'now-selling', 'assignments', 
                               'register-now', 'resale', 'projects'];
        
        // Known city slugs (from preConCities - these are listing pages, not project pages)
        const knownCitySlugs = ['toronto', 'brampton', 'hamilton', 'calgary', 'mississauga', 'oakville', 'milton', 'edmonton'];
        
        // Known sub-property type slugs (exact matches only - these are listing pages)
        const knownSubPropertyTypeSlugs = [
          'high-rise-condos',
          'mid-rise-condos',
          'low-rise-condos',
          'link-houses',
          'townhouse-houses',
          'semi-detached-houses',
          'detached-houses',
        ];
        
        // Check if it's a completion year (4-digit number between 2020-2100)
        const isYear = /^\d{4}$/.test(slug) && parseInt(slug, 10) >= 2020 && parseInt(slug, 10) <= 2100;
        
        // Check if it's a known category
        const isKnownCategory = knownCategories.includes(slugLower);
        
        // Check if it's a known city
        const isKnownCity = knownCitySlugs.includes(slugLower);
        
        // Check if it's a known sub-property type (exact match only)
        const isSubPropertyType = knownSubPropertyTypeSlugs.includes(slugLower);
        
        // If it's a known listing page pattern (category, city, year, sub-property type), it should have sticky navbar
        if (isKnownCategory || isKnownCity || isYear || isSubPropertyType) {
          return false; // Listing page - should have sticky navbar
        }
        
        // If it's NOT a known listing page, treat it as a project detail page (no sticky navbar)
        // This covers all project slugs (with or without numbers)
        return true; // Project detail page - no sticky navbar
      }
      
      return false; // Default: treat as listing page (sticky navbar)
    }
    
    // Rent: only match actual property detail pages
    if (pathname.startsWith('/rent/') && pathname.split('/').length > 2) {
      return true;
    }
    
    // New property page pattern: /{citySlug}/{slug} where slug contains numbers
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length === 2) {
      const [citySlug, slug] = pathParts;
      // Property pages: citySlug doesn't end with -real-estate AND slug contains numbers
      if (citySlug && slug && !citySlug.endsWith('-real-estate') && /\d/.test(slug)) {
        return true;
      }
    }
    
    return false;
  })();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [showBuyDropdown, setShowBuyDropdown] = useState(false);
  const [showRentDropdown, setShowRentDropdown] = useState(false);
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  // Scroll detection for navbar background only (disabled on property pages)
  useEffect(() => {
    if (isPropertyPage) return; // Disable sticky behavior on property pages
    
    let ticking = false;

    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Use requestAnimationFrame for smooth updates
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsAtTop(currentScrollY < 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    controlNavbar(); // Check initial position
    
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [isPropertyPage]);



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
          "w-full top-0 left-0 right-0 z-[99]",
          "navbar-smooth",
          "will-change-[background-color,backdrop-filter,border-color,box-shadow]",
          isPropertyPage 
            ? "relative" // Use relative positioning on property pages
            : "fixed", // Use fixed positioning on other pages
          isAtTop && !isPropertyPage
            ? "bg-transparent backdrop-blur-none shadow-none border-transparent" 
            : "bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm"
        )}
        style={{
          // Ensure consistent height to prevent layout shifts
          minHeight: '4rem',
          height: '4rem',
        }}
      >
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
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
                      src="/images/logo/summitly-logo.png"
                      alt="Summitly Logo"
                      width={200}
                      height={60}
                      className="h-7 w-auto transition-all duration-300"
                      priority
                      quality={75}
                    />
                  </motion.div>
                </Link>
              </motion.div>

              {/* Buy, Rent, Mortgage - Desktop Only */}
              <nav className="hidden lg:flex items-center space-x-1">
                {/* Buy Mega Menu */}
                <BuyMegaMenu
                  isOpen={showBuyDropdown}
                  onMouseEnter={() => setShowBuyDropdown(true)}
                  onMouseLeave={() => setShowBuyDropdown(false)}
                >
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide flex items-center gap-1 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Buy
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showBuyDropdown && "rotate-180")} />
                  </motion.div>
                </BuyMegaMenu>

                {/* Rent Mega Menu */}
                <RentMegaMenu
                  isOpen={showRentDropdown}
                  onMouseEnter={() => setShowRentDropdown(true)}
                  onMouseLeave={() => setShowRentDropdown(false)}
                >
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide flex items-center gap-1 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Rent
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showRentDropdown && "rotate-180")} />
                  </motion.div>
                </RentMegaMenu>

                {/* Pre-Con Mega Menu */}
                <ProjectsMegaMenu
                  isOpen={showProjectsDropdown}
                  onMouseEnter={() => setShowProjectsDropdown(true)}
                  onMouseLeave={() => setShowProjectsDropdown(false)}
                >
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide flex items-center gap-1 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Link href="/pre-con" className="hover:text-primary">
                      Pre-Con
                    </Link>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showProjectsDropdown && "rotate-180")} />
                  </motion.div>
                </ProjectsMegaMenu>

                {/* Mortgage Link */}
                <a 
                  href="https://mortgagesquad.ca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    Mortgage
                  </motion.div>
                </a>

                {/* My Home Link */}
                <Link href="/homeowner">
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                  >
                    My Home
                  </motion.div>
                </Link>

                {/* More Mega Menu */}
                <MoreMegaMenu
                  isOpen={showMoreDropdown}
                  onMouseEnter={() => setShowMoreDropdown(true)}
                  onMouseLeave={() => setShowMoreDropdown(false)}
                >
                  <motion.div
                    className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-brand-tide flex items-center gap-1 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    More
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showMoreDropdown && "rotate-180")} />
                  </motion.div>
                </MoreMegaMenu>
              </nav>
            </div>

            {/* Right Side: AI Button, Search, Login, Mobile Menu Button */}
            <div className="flex flex-1 min-w-0 justify-end items-center space-x-2 lg:space-x-3 lg:min-w-[420px]">
              {/* AI Button */}
              <div className="hidden lg:flex">
                <Link
                  href="/ai"
                  aria-label="Open AI chat"
                  className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <AIButton size="sm" className="cursor-pointer" />
                </Link>
              </div>
              
              {/* Search: same behavior as AutocompleteSearch (properties + locations) */}
              <div className="hidden lg:flex flex-1 min-w-[260px] max-w-[420px]">
                <AutocompleteSearch
                  placeholder="Search properties or locations..."
                  className="w-full"
                  inputClassName="h-10 text-sm bg-white/80 border-slate-200 focus:ring-sky-500/40 focus:border-sky-500"
                />
              </div>
              {/* Login / Signup Button or User Profile */}
              {session ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <UserProfileDropdown />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Button
                    onClick={handleLoginClick}
                    className="flex items-center space-x-2 rounded-full"
                    variant="default"
                  >
                    <FaUserCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Login / Signup</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
                </motion.div>
              )}

              {/* Mobile Menu Button (for original mobile nav) */}
              <motion.button
                onClick={openNav}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
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