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
  MapPin, 
  Calculator, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { getBlogPosts } from '@/data/data';

interface BuyMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  children: React.ReactNode;
}

type CategoryType = 'popular-searches' | 'new-condos-and-homes' | 'buying-resources';

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
    id: 'popular-searches',
    title: 'Popular Searches',
    description: 'Browse popular searches for properties for sale'
  },
  {
    id: 'new-condos-and-homes',
    title: 'New Condos & Homes',
    description: 'Explore new condos and homes for sale'
  },
  {
    id: 'buying-resources',
    title: 'Buying Resources',
    description: 'Tools and guides'
  }
];

const buyBase = '/buy/toronto';

/** Popular Searches – Column 1 */
const popularSearchesColumn1: { label: string; href: string }[] = [
  { label: 'New Listings', href: `${buyBase}/new-listings` },
  { label: 'Open Houses', href: `${buyBase}/open-houses` },
  { label: 'Listed in Last 7 Days', href: `${buyBase}/last-7-days` },
  { label: 'Listed in Last 24 Hours', href: `${buyBase}/last-24-hours` },
  { label: 'Price Reduced', href: `${buyBase}/price-reduced` },
  { label: 'Back on Market', href: `${buyBase}/back-on-market` },
  { label: 'Motivated Sellers', href: `${buyBase}/motivated-sellers` },
  { label: 'Great Value (Below Market)', href: `${buyBase}/great-value` },
];

/** Popular Searches – Column 2 */
const popularSearchesColumn2: { label: string; href: string }[] = [
  { label: 'Recently Sold', href: `${buyBase}/recently-sold` },
  { label: 'Power of Sale', href: `${buyBase}/power-of-sale` },
  { label: 'Foreclosure / Distressed', href: `${buyBase}/foreclosure` },
  { label: 'Estate Sales', href: `${buyBase}/estate-sales` },
  { label: 'Assignment Sales', href: `${buyBase}/assignment-sales` },
  { label: 'Fixer-Uppers', href: `${buyBase}/fixer-uppers` },
  { label: 'Quick Closing Available', href: `${buyBase}/quick-closing` },
];

const forSaleItems: ContentItem[] = [
  { id: 'houses', label: 'Houses', description: 'Browse all houses for sale in your area', href: '/properties/toronto/houses', icon: Home },
  { id: 'townhouses', label: 'Townhouses', description: 'Find your perfect townhouse today', href: '/properties/toronto/townhouses', icon: Building2 },
  { id: 'condos', label: 'Condos', description: 'Explore condominiums and apartments', href: '/properties/toronto/condos', icon: Building2 },
  { id: 'detached-homes', label: 'Detached Homes', description: 'Browse detached homes for sale', href: '/properties/toronto/detached-homes', icon: Home },
  { id: 'semi-detached', label: 'Semi-Detached', description: 'Find semi-detached homes', href: '/properties/toronto/semi-detached-homes', icon: Building2 },
  { id: 'lofts', label: 'Lofts', description: 'Explore modern loft spaces', href: '/properties/toronto/lofts', icon: Building2 },
  { id: 'under-500k', label: 'Homes Under $500K', description: 'Affordable homes under $500,000', href: '/properties/toronto/under-500000', icon: DollarSign },
  { id: 'under-1m', label: 'Homes Under $1M', description: 'Browse homes under $1 million', href: '/properties/toronto/under-1000000', icon: DollarSign },
  { id: 'luxury', label: 'Luxury Homes', description: 'Premium properties over $2M', href: '/properties/toronto/over-2000000', icon: TrendingUp },
  { id: '1-bedroom', label: '1-Bedroom Homes', description: 'Perfect starter homes', href: '/properties/toronto/1-bedroom', icon: Home },
  { id: '2-bedroom', label: '2-Bedroom Homes', description: 'Ideal for small families', href: '/properties/toronto/2-bedroom', icon: Home },
  { id: '3-bedroom', label: '3-Bedroom Homes', description: 'Spacious family homes', href: '/properties/toronto/3-bedroom', icon: Home },
];

const preConBase = '/pre-con';

/** New Condos – search options column */
const newCondosColumn: { label: string; href: string }[] = [
  { label: 'Search by City', href: `${preConBase}/cities` },
  { label: 'Search by Neighbourhood', href: `${preConBase}/projects` },
  { label: 'Search by Intersection', href: `${preConBase}` },
  { label: 'Search by Project', href: `${preConBase}/projects` },
  { label: 'Search by Builder', href: `${preConBase}/projects` },
  { label: 'Search by Status (Coming Soon / Pre-Launch / Now Selling)', href: `${preConBase}/selling` },
  { label: 'Search by Occupancy Date', href: `${preConBase}/projects` },
  { label: 'Search by Price / Under $X', href: `${preConBase}/projects` },
  { label: 'Search by Bedrooms (Studio / 1 / 1+Den / 2 / 2+Den)', href: `${preConBase}/condos` },
  { label: 'Platinum / VIP Access', href: `${preConBase}/projects` },
  { label: 'Special Promotions / Incentives', href: `${preConBase}` },
];

/** New Homes – search options column */
const newHomesColumn: { label: string; href: string }[] = [
  { label: 'Search by City', href: `${preConBase}/cities` },
  { label: 'Search by Neighbourhood / Community', href: `${preConBase}/projects` },
  { label: 'Search by Intersection', href: `${preConBase}` },
  { label: 'Search by Project / Community', href: `${preConBase}/projects` },
  { label: 'Search by Builder', href: `${preConBase}/projects` },
  { label: 'Search by Status (Coming Soon / Pre-Launch / Now Selling)', href: `${preConBase}/selling` },
  { label: 'Search by Occupancy Date', href: `${preConBase}/projects` },
  { label: 'Quick Move-In / Quick Possession', href: `${preConBase}/projects` },
  { label: 'Search by Price / Under $X', href: `${preConBase}/projects` },
  { label: 'Search by Type (Townhome / Semi / Detached)', href: `${preConBase}/houses` },
  { label: 'Search by Bedrooms (3 / 4 / 5+)', href: `${preConBase}/houses` },
  { label: 'Platinum / VIP Access', href: `${preConBase}/projects` },
  { label: 'Special Promotions / Incentives', href: `${preConBase}` },
];

const newHomesItems: ContentItem[] = [
  { id: 'discover', label: 'Discover Your New Home', description: 'Find new construction projects', href: '/pre-con', icon: MapPin },
  { id: 'new-homes-sale', label: 'New Homes For Sale', description: 'Browse all new construction listings', href: '/pre-con/projects', icon: Home },
  { id: 'communities', label: 'New Home Communities', description: 'Explore master-planned communities', href: '/pre-con/projects', icon: Building2 },
  { id: 'news', label: 'New Construction News', description: 'Stay updated on new developments', href: '/pre-con', icon: TrendingUp },
];

const buyingResourcesItems: ContentItem[] = [
  { id: 'affordability', label: 'How Much Can I Afford', description: 'Calculate your home buying budget', href: '/calculators/affordability', icon: Calculator },
  { id: 'mortgage-calculator', label: 'Mortgage Calculator', description: 'Estimate your monthly payments', href: '/calculators', icon: DollarSign },
  { id: 'buying-guide', label: 'Buying Guide', description: 'Complete guide to buying a home', href: '/buying-guide', icon: BookOpen },
  { id: 'articles', label: 'Home Buying Articles', description: 'Expert tips and advice', href: '/articles?category=home-buying', icon: FileText },
];

const getCategoryTitle = (category: CategoryType): string => {
  const titles: Record<CategoryType, string> = {
    'popular-searches': 'Popular Searches',
    'new-condos-and-homes': 'Explore New Condos & Homes',
    'buying-resources': 'Buying Tools & Resources'
  };
  return titles[category];
};

const getCategoryDescription = (category: CategoryType): string => {
  const descriptions: Record<CategoryType, string> = {
    'popular-searches': 'Fresh listings, hot deals, and quick ways to find the right home fast.',
    'new-condos-and-homes': 'Discover new construction projects and master-planned communities. Get early access to the latest developments.',
    'buying-resources': 'Use our calculators and guides to make informed decisions. Learn everything you need to know about buying a home.'
  };
  return descriptions[category];
};

const getContentForCategory = (category: CategoryType): ContentItem[] => {
  switch (category) {
    case 'popular-searches': 
      return forSaleItems;
    case 'new-condos-and-homes': 
      return newHomesItems;
    case 'buying-resources': 
      return buyingResourcesItems;
    default: 
      return forSaleItems;
  }
};

export const BuyMegaMenu: React.FC<BuyMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  className = "",
  children
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('popular-searches');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get blogs related to home buying
  const blogs = getBlogPosts({
    category: 'Home Buying',
    search: 'buying'
  }).slice(0, 2);

  // Fallback to general blogs if no category match
  const displayBlogs = blogs.length === 0 
    ? getBlogPosts({ search: 'home' }).slice(0, 2)
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
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      {getCategoryTitle(activeCategory)}
                    </h4>
                    <p className="text-sm text-foreground mb-4">
                      {getCategoryDescription(activeCategory)}
                    </p>
                    {activeCategory === 'popular-searches' ? (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                        <nav className="flex flex-col" aria-label="Popular searches column 1">
                          {popularSearchesColumn1.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="py-2.5 border-b border-border/60 text-sm text-foreground hover:text-primary transition-colors last:border-b-0"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </nav>
                        <nav className="flex flex-col" aria-label="Popular searches column 2">
                          {popularSearchesColumn2.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="py-2.5 border-b border-border/60 text-sm text-foreground hover:text-primary transition-colors last:border-b-0"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </nav>
                      </div>
                    ) : activeCategory === 'new-condos-and-homes' ? (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                        <div>
                          <h5 className="text-sm font-semibold text-foreground pb-2 mb-2 border-b border-border">
                            New Condos
                          </h5>
                          <nav className="flex flex-col" aria-label="New condos search options">
                            {newCondosColumn.map((item) => (
                              <Link
                                key={item.href + item.label}
                                href={item.href}
                                className="py-2.5 border-b border-border/60 text-sm text-foreground hover:text-primary transition-colors last:border-b-0"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </nav>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground pb-2 mb-2 border-b border-border">
                            New Homes
                          </h5>
                          <nav className="flex flex-col" aria-label="New homes search options">
                            {newHomesColumn.map((item) => (
                              <Link
                                key={item.href + item.label}
                                href={item.href}
                                className="py-2.5 border-b border-border/60 text-sm text-foreground hover:text-primary transition-colors last:border-b-0"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </nav>
                        </div>
                      </div>
                    ) : (
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
                    )}
                    <Link
                      href={
                        activeCategory === 'popular-searches'
                          ? '/buy/toronto'
                          : activeCategory === 'new-condos-and-homes'
                            ? '/pre-con'
                            : '/buy'
                      }
                      className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary hover:underline"
                    >
                      View all{' '}
                      {activeCategory === 'popular-searches'
                        ? 'properties for sale'
                        : activeCategory === 'new-condos-and-homes'
                          ? 'new condos & homes'
                          : activeCategory.replace(/-/g, ' ')}
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

export default BuyMegaMenu;
