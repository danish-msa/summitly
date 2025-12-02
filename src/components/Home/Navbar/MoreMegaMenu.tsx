"use client";

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  Home,
  MapPin,
  DollarSign,
  Calculator,
  Users,
  FileText,
  Phone,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

interface MoreMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MoreMegaMenu: React.FC<MoreMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  className,
  children,
}) => {
  const menuSections: MenuSection[] = [
    {
      title: 'Browse',
      items: [
        {
          id: 'listings',
          label: 'Listings',
          description: 'View all property listings',
          href: '/listings',
          icon: Home,
        },
        {
          id: 'map-search',
          label: 'Map Search',
          description: 'Search properties on map',
          href: '/map-search',
          icon: MapPin,
        },
      ],
    },
    {
      title: 'Buy & Sell',
      items: [
        {
          id: 'buy',
          label: 'Buy with us',
          description: 'Find your dream home',
          href: '/buy',
          icon: Home,
        },
        {
          id: 'sell',
          label: 'Sell with us',
          description: 'Sell your property',
          href: '/sell',
          icon: DollarSign,
        },
        {
          id: 'home-estimator',
          label: 'Home Estimator',
          description: 'Estimate your home value',
          href: '/home-estimation',
          icon: Calculator,
        },
      ],
    },
    {
      title: 'Services',
      items: [
        {
          id: 'find-realtor',
          label: 'Find a Realtor',
          description: 'Connect with expert agents',
          href: '/agents',
          icon: Users,
        },
        {
          id: 'calculators',
          label: 'Calculators',
          description: 'Mortgage & affordability tools',
          href: '/calculators',
          icon: Calculator,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          id: 'about',
          label: 'About Us',
          description: 'Learn about Summitly',
          href: '/about',
          icon: FileText,
        },
        {
          id: 'contact',
          label: 'Contact Us',
          description: 'Get in touch',
          href: '/contact',
          icon: Phone,
        },
        {
          id: 'faqs',
          label: 'FAQs',
          description: 'Frequently asked questions',
          href: '/faqs',
          icon: HelpCircle,
        },
        {
          id: 'blogs',
          label: 'Blogs',
          description: 'Real estate insights & news',
          href: '/blogs',
          icon: BookOpen,
        },
      ],
    },
  ];

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9997] pointer-events-auto"
                style={{ top: '64px' }}
              />
              
              {/* Mega Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="fixed left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-[9998]"
                style={{ top: '64px' }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {menuSections.map((section, sectionIndex) => (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.05 }}
                      >
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                          {section.title}
                        </h3>
                        <ul className="space-y-2">
                          {section.items.map((item) => {
                            const IconComponent = item.icon;
                            const isExternal = item.external;
                            
                            const linkContent = (
                              <motion.li
                                whileHover={{ x: 4 }}
                                className="group"
                              >
                                <Link
                                  href={item.href}
                                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/10 transition-colors"
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-10 h-10 flex items-center justify-center bg-secondary/20 rounded-lg group-hover:bg-primary/20 group-hover:text-white transition-colors">
                                      <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                                        {item.label}
                                      </p>
                                      {isExternal && (
                                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                                </Link>
                              </motion.li>
                            );

                            return isExternal ? (
                              <a
                                key={item.id}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {linkContent}
                              </a>
                            ) : (
                              <div key={item.id}>{linkContent}</div>
                            );
                          })}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

