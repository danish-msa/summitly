"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  List,
  MessageSquare,
  DollarSign,
  Users,
  FileText,
  Wallet,
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

interface RentalsMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  /** Number of link columns (default 1). Use 2 for two per row. */
  itemsPerRow?: 1 | 2;
}

const menuSections: MenuSection[] = [
  {
    title: "Management tasks",
    items: [
      {
        id: "list-property",
        label: "List your property for rent",
        href: "/manage-rentals/listing",
        icon: List,
      },
      {
        id: "view-properties",
        label: "View your properties",
        href: "/manage-rentals",
        icon: Home,
      },
      {
        id: "messages",
        label: "Read your messages",
        href: "/manage-rentals",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Tools for rental managers",
    itemsPerRow: 2,
    items: [
      {
        id: "rental-value",
        label: "Check your property's rental value",
        href: "/manage-rentals/price-my-rental",
        icon: DollarSign,
      },
      {
        id: "screen-renters",
        label: "Screen renters with applications",
        href: "/manage-rentals",
        icon: Users,
      },
      {
        id: "leases",
        label: "Create and manage leases",
        href: "/manage-rentals/rental-lease-agreements",
        icon: FileText,
      },
      {
        id: "collect-rent",
        label: "Collect rent",
        href: "/manage-rentals",
        icon: Wallet,
      },
      {
        id: "learn",
        label: "Learn about renting out your property",
        href: "/manage-rentals",
        icon: BookOpen,
      },
      {
        id: "help-center",
        label: "Search help center",
        href: "/faqs",
        icon: HelpCircle,
      },
      {
        id: "rental-manager",
        label: "Explore Summitly Rental Manager",
        href: "/manage-rentals",
        icon: LayoutDashboard,
      },
    ],
  },
];

export const RentalsMegaMenu: React.FC<RentalsMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  className,
  children,
}) => {
  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9997] pointer-events-auto"
                  style={{ top: "64px" }}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-[9998]"
                  style={{ top: "64px" }}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-8">
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
                          <ul
                            className={
                              section.itemsPerRow === 2
                                ? "grid grid-cols-2 gap-x-6 gap-y-1"
                                : "space-y-1"
                            }
                          >
                            {section.items.map((item) => {
                              const IconComponent = item.icon;
                              return (
                                <motion.li
                                  key={item.id}
                                  whileHover={{ x: 4 }}
                                  className="group"
                                >
                                  <Link
                                    href={item.href}
                                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/10 transition-colors"
                                  >
                                    <div className="flex-shrink-0">
                                      <div className="w-9 h-9 flex items-center justify-center bg-secondary/15 rounded-lg group-hover:bg-secondary/25 transition-colors">
                                        <IconComponent className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" />
                                      </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors flex-1">
                                      {item.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                                  </Link>
                                </motion.li>
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
