"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Hammer, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Props = {
  openNav: () => void;
};

const MobileBottomNav = ({ openNav }: Props) => {
  const pathname = usePathname();

  // Hide on dashboard pages
  const isDashboardPage = pathname?.startsWith('/dashboard');
  
  if (isDashboardPage) {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      label: 'Listings',
      href: '/listings',
      icon: Building2,
    },
    {
      label: 'Pre-Con',
      href: '/pre-con',
      icon: Hammer,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-border shadow-lg md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 px-2 py-2 transition-colors",
              isActive('/') ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Home className={cn("h-5 w-5", isActive('/') && "text-primary")} />
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Listings */}
          <Link
            href="/listings"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 px-2 py-2 transition-colors",
              isActive('/listings') ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Building2 className={cn("h-5 w-5", isActive('/listings') && "text-primary")} />
            <span className="text-xs font-medium">Listings</span>
          </Link>

          {/* Summitly Logo - Center */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 px-2 py-2"
          >
            <Image
              src="/images/logo/favicon.png"
              alt="Summitly"
              width={24}
              height={24}
              className="h-8 w-8"
            />
            <span className="text-[10px] font-semibold text-foreground">Summitly</span>
          </Link>

          {/* Pre-Con */}
          <Link
            href="/pre-con"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 px-2 py-2 transition-colors",
              isActive('/pre-con') ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Hammer className={cn("h-5 w-5", isActive('/pre-con') && "text-primary")} />
            <span className="text-xs font-medium">Pre-Con</span>
          </Link>

          {/* More - Opens Mobile Menu Panel */}
          <button
            onClick={openNav}
            className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 px-2 py-2 transition-colors text-muted-foreground"
          >
            <MoreVertical className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
};

export default MobileBottomNav;

