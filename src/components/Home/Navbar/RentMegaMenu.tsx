"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Building2, 
  Calculator, 
  BookOpen, 
  FileText, 
  Shield,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { getBlogPosts } from '@/data/data';

interface RentMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  children: React.ReactNode;
}

type CategoryType = 'rentals' | 'rental-resources';

interface CategoryItem {
  id: CategoryType;
  title: string;
  description: string;
}

interface ContentItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainCategories: CategoryItem[] = [
  {
    id: 'rentals',
    title: 'Rentals',
    description: 'Find rental properties'
  },
  {
    id: 'rental-resources',
    title: 'Rental Resources',
    description: 'Tools and guides'
  }
];

const rentalItems: ContentItem[] = [
  { id: 'apartments', label: 'Apartments', description: 'Find apartments for rent', href: '/rent?type=apartments', icon: Building2 },
  { id: 'houses', label: 'Houses', description: 'Rent a house in your area', href: '/rent?type=houses', icon: Home },
  { id: 'condos', label: 'Condos', description: 'Condominiums available for rent', href: '/rent?type=condos', icon: Building2 },
  { id: 'townhouses', label: 'Townhouses', description: 'Townhouse rental options', href: '/rent?type=townhouses', icon: Home },
];

const rentalResourcesItems: ContentItem[] = [
  { id: 'rent-calculator', label: 'Rent Calculator', description: 'Calculate your rental budget', href: '/calculators/rent', icon: Calculator },
  { id: 'renting-guide', label: 'Renting Guide', description: 'Complete guide to renting', href: '/renting-guide', icon: BookOpen },
  { id: 'rental-articles', label: 'Rental Articles', description: 'Tips for renters', href: '/articles?category=renting', icon: FileText },
  { id: 'tenant-protection', label: 'Tenant Protection', description: 'Know your rights as a tenant', href: '/tenant-protection', icon: Shield },
];

const getCategoryTitle = (category: CategoryType): string => {
  const titles: Record<CategoryType, string> = {
    'rentals': 'Browse Rental Properties',
    'rental-resources': 'Rental Tools & Resources'
  };
  return titles[category];
};

const getCategoryDescription = (category: CategoryType): string => {
  const descriptions: Record<CategoryType, string> = {
    'rentals': 'Discover amazing rental properties that fit your lifestyle and budget. Find apartments, houses, condos, and more.',
    'rental-resources': 'Use our calculators and guides to make informed rental decisions. Learn about tenant rights and renting tips.'
  };
  return descriptions[category];
};

const getContentForCategory = (category: CategoryType): ContentItem[] => {
  switch (category) {
    case 'rentals': 
      return rentalItems;
    case 'rental-resources': 
      return rentalResourcesItems;
    default: 
      return rentalItems;
  }
};

export const RentMegaMenu: React.FC<RentMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  className = "",
  children
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('rentals');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get blogs related to renting
  const blogs = getBlogPosts({
    category: 'Renting',
    search: 'renting'
  }).slice(0, 2);

  // Fallback to general blogs if no category match
  const displayBlogs = blogs.length === 0 
    ? getBlogPosts({ search: 'rent' }).slice(0, 2)
    : blogs;

  const contentItems = getContentForCategory(activeCategory);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-[9999] flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-background rounded-xl shadow-[0px_20px_40px_0px_rgba(0,0,0,0.1)] pointer-events-auto mt-2 overflow-hidden border border-border"
            style={{
              width: 'min(95vw, 1200px)',
              maxWidth: '1200px'
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div className="flex min-h-[400px]">
              {/* Left Column - Main Categories */}
              <div className="w-64 border-r border-border bg-white p-2">
                <div className="space-y-1">
                  {mainCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      onMouseEnter={() => setActiveCategory(category.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center justify-between group",
                        activeCategory === category.id
                          ? "bg-secondary/10 border-l-2 border-l-secondary"
                          : "hover:bg-muted/50 border-l-2 border-l-transparent"
                      )}
                    >
                      <div>
                        <h3 className={cn(
                          "font-semibold text-sm transition-colors",
                          activeCategory === category.id ? "text-primary" : "text-foreground"
                        )}>
                          {category.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {category.description}
                        </p>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-all",
                        activeCategory === category.id 
                          ? "text-primary opacity-100" 
                          : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      )} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle Column - Dynamic Content */}
              <div className="flex-1 p-6 bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      {getCategoryTitle(activeCategory)}
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {contentItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                              hoveredItem === item.id 
                                ? "bg-secondary/10" 
                                : "hover:bg-muted/50"
                            )}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                              hoveredItem === item.id 
                                ? "bg-primary/20" 
                                : "bg-secondary/20"
                            )}>
                              <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                hoveredItem === item.id ? "text-primary" : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={cn(
                                "text-sm font-semibold transition-colors",
                                hoveredItem === item.id ? "text-primary" : "text-foreground"
                              )}>
                                {item.label}
                              </h5>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href="/rent"
                      className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary hover:underline"
                    >
                      View all {activeCategory.replace('-', ' ')}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Column - Featured Blogs */}
              <div className="w-72 bg-muted/30 p-6 border-l border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                  Latest News
                </h4>
                <p className="text-sm text-foreground font-semibold leading-relaxed mb-3">
                  {getCategoryDescription(activeCategory)}
                </p>
                <div className="space-y-3">
                  {displayBlogs.map((blog) => (
                    <Link
                      key={blog.id}
                      href={`/blogs?id=${blog.id}`}
                      className="block group"
                    >
                      <div className="flex gap-3 p-2 hover:bg-background rounded-lg transition-colors">
                        {blog.image && (
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                            <Image
                              src={blog.image}
                              alt={blog.title}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {blog.title}
                          </h5>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {blog.excerpt}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary hover:underline"
                >
                  View all articles
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
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

export default RentMegaMenu;
