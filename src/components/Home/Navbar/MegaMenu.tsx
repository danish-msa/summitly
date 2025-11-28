"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Home, Building2, Warehouse, MapPin, Calculator, BookOpen, FileText, TrendingUp, Search, KeyRound, DollarSign, Shield } from 'lucide-react';

interface MegaMenuItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  description?: string;
  badge?: string;
}

interface MegaMenuColumn {
  title: string;
  items: MegaMenuItem[];
}

interface MegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  columns: MegaMenuColumn[];
  featuredContent?: {
    title: string;
    description: string;
    image: string;
    link: string;
  };
  className?: string;
  children: React.ReactNode;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  columns,
  featuredContent,
  className = "",
  children
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-x-0 top-16 z-[9999] flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-[0px_15px_30px_0px_rgba(16,24,40,0.1)] p-4 xl:py-8 lg:py-4 pointer-events-auto mt-2"
              style={{
                width: 'min(95vw, 1536px)',
                maxWidth: '1536px'
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
            <div className="lg:flex justify-between gap-6">
              {/* Main Content Columns */}
              <div className="p-0 pr-4 lg:flex lg:justify-between lg:w-2/3">
                {columns.map((column, colIndex) => (
                  <ul
                    key={colIndex}
                    className="text-sm text-gray-700 mb-6 lg:mb-0"
                    aria-labelledby={`mega-menu-column-${colIndex}`}
                  >
                    <h6 className="font-medium text-sm text-gray-500 mb-4">
                      {column.title}
                    </h6>
                    {column.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <li key={itemIndex}>
                          <Link
                            href={item.href}
                            className="px-3 py-5 transition-all duration-500 hover:bg-gray-50 hover:rounded-xl flex group"
                          >
                            {Icon && (
                              <div className="rounded-lg w-12 h-12 flex items-center justify-center bg-gray-50 group-hover:bg-primary/10 transition-colors">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                            )}
                            <div className={cn("ml-4", Icon ? "w-4/5" : "w-full")}>
                              <div className="flex items-center gap-2">
                                <h5 className="text-gray-900 text-base mb-1.5 font-semibold">
                                  {item.title}
                                </h5>
                                {item.badge && (
                                  <span className="bg-indigo-50 text-indigo-500 text-xs font-medium px-2.5 py-1 rounded-full h-5">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs font-medium text-gray-400">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </div>

              {/* Featured Content Sidebar */}
              {featuredContent && (
                <div className="bg-gray-50 p-8 lg:w-1/3 rounded-lg">
                  <h6 className="font-medium text-sm text-gray-500 mb-5">
                        Latest News
                      </h6>
                  <div className="mb-6 relative w-full h-36 rounded-lg overflow-hidden">
                    <Image
                      src={featuredContent.image}
                      alt={featuredContent.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="block">
                    <h5 className="text-gray-900 text-base mb-1.5 font-semibold">
                      {featuredContent.title}
                    </h5>
                    <p className="text-sm font-medium text-gray-400">
                      {featuredContent.description}
                    </p>
                    <Link
                      href={featuredContent.link}
                      className="flex items-center mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Learn more
                      <svg
                        className="ml-2"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 8L12.6667 8M9.33333 12L12.8619 8.4714C13.0842 8.24918 13.1953 8.13807 13.1953 8C13.1953 7.86193 13.0842 7.75082 12.8619 7.5286L9.33333 4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {mounted && createPortal(menuContent, document.body)}
    </div>
  );
};

// Buy Menu Configuration
export const buyMenuColumns: MegaMenuColumn[] = [
  {
    title: "For Sale",
    items: [
      {
        title: "Houses",
        href: "/buy?type=houses",
        icon: Home,
        description: "Browse all houses for sale in your area"
      },
      {
        title: "Townhouses",
        href: "/buy?type=townhouses",
        icon: Building2,
        description: "Find your perfect townhouse today"
      },
      {
        title: "Condos",
        href: "/buy?type=condos",
        icon: Building2,
        description: "Explore condominiums and apartments"
      },
      {
        title: "Mobile Homes",
        href: "/buy?type=mobile-homes",
        icon: Home,
        description: "Affordable mobile home options"
      },
      {
        title: "Open Houses",
        href: "/buy?type=open-houses",
        icon: Search,
        description: "View scheduled open house events"
      }
    ]
  },
  {
    title: "New Homes",
    items: [
      {
        title: "Discover Your New Home",
        href: "/new-homes/discover",
        icon: MapPin,
        description: "Find new construction projects"
      },
      {
        title: "New Homes For Sale",
        href: "/new-homes",
        icon: Home,
        description: "Browse all new construction listings"
      },
      {
        title: "New Home Communities",
        href: "/new-homes/communities",
        icon: Building2,
        description: "Explore master-planned communities"
      },
      {
        title: "New Construction News",
        href: "/new-homes/news",
        icon: TrendingUp,
        description: "Stay updated on new developments"
      }
    ]
  },
  {
    title: "Buying Resources",
    items: [
      {
        title: "How Much Can I Afford",
        href: "/calculators/affordability",
        icon: Calculator,
        description: "Calculate your home buying budget"
      },
      {
        title: "Mortgage Calculator",
        href: "/calculators",
        icon: DollarSign,
        description: "Estimate your monthly payments"
      },
      {
        title: "Buying Guide",
        href: "/buying-guide",
        icon: BookOpen,
        description: "Complete guide to buying a home"
      },
      {
        title: "Home Buying Articles",
        href: "/articles?category=home-buying",
        icon: FileText,
        description: "Expert tips and advice"
      }
    ]
  }
];

// Rent Menu Configuration
export const rentMenuColumns: MegaMenuColumn[] = [
  {
    title: "Rentals",
    items: [
      {
        title: "Apartments",
        href: "/rent?type=apartments",
        icon: Building2,
        description: "Find apartments for rent"
      },
      {
        title: "Houses",
        href: "/rent?type=houses",
        icon: Home,
        description: "Rent a house in your area"
      },
      {
        title: "Condos",
        href: "/rent?type=condos",
        icon: Building2,
        description: "Condominiums available for rent"
      },
      {
        title: "Townhouses",
        href: "/rent?type=townhouses",
        icon: Home,
        description: "Townhouse rental options"
      }
    ]
  },
  {
    title: "Rental Resources",
    items: [
      {
        title: "Rent Calculator",
        href: "/calculators/rent",
        icon: Calculator,
        description: "Calculate your rental budget"
      },
      {
        title: "Renting Guide",
        href: "/renting-guide",
        icon: BookOpen,
        description: "Complete guide to renting"
      },
      {
        title: "Rental Articles",
        href: "/articles?category=renting",
        icon: FileText,
        description: "Tips for renters"
      },
      {
        title: "Tenant Protection",
        href: "/tenant-protection",
        icon: Shield,
        description: "Know your rights as a tenant"
      }
    ]
  }
];

export default MegaMenu;

