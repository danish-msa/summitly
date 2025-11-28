"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Building2, Calendar, Tag, Users, BookOpen, Home, Warehouse, Building, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { getBlogPosts } from '@/data/data';

interface ProjectsMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
  children: React.ReactNode;
}

interface FilterData {
  propertyTypes: string[];
  developers: string[];
  sellingStatuses: string[];
  occupancyYears: number[];
}

export const ProjectsMegaMenu: React.FC<ProjectsMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  className = "",
  children
}) => {
  const [mounted, setMounted] = useState(false);
  const [filterData, setFilterData] = useState<FilterData>({
    propertyTypes: [],
    developers: [],
    sellingStatuses: [],
    occupancyYears: [],
  });
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch data once when component mounts, not every time menu opens
    if (mounted && !dataFetched) {
      fetchFilterData();
    }
  }, [mounted, dataFetched]);

  const fetchFilterData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pre-con-projects/filters');
      if (response.ok) {
        const data = await response.json();
        setFilterData(data);
        setDataFetched(true);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get blogs related to pre-construction
  const preConBlogs = getBlogPosts({ 
    category: 'Pre-Construction',
    search: 'pre-construction'
  }).slice(0, 3);

  // If no category match, try searching by tags/title
  const fallbackBlogs = preConBlogs.length === 0 
    ? getBlogPosts({ search: 'construction' }).slice(0, 3)
    : preConBlogs;

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'platinum-access': 'Platinum Access',
      'now-selling': 'Now Selling',
      'coming-soon': 'Coming Soon',
      'assignments': 'Assignments',
      'register-now': 'Register Now',
      'resale': 'Resale',
      'sold-out': 'Sold Out'
    };
    return statusMap[status] || status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPropertyType = (type: string) => {
    return type.replace(/-/g, ' ');
  };

  const getPropertyTypeSlug = (type: string) => {
    // Map property types to their URL slugs
    const slugMap: Record<string, string> = {
      'Condos': 'condos',
      'Houses': 'houses',
      'Lofts': 'lofts',
      'Master-Planned Communities': 'master-planned-communities',
      'Multi Family': 'multi-family',
      'Offices': 'offices'
    };
    return slugMap[type] || type.toLowerCase().replace(/\s+/g, '-');
  };

  const getPropertyTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('condo')) return Building2;
    if (typeLower.includes('house')) return Home;
    if (typeLower.includes('loft')) return Warehouse;
    if (typeLower.includes('community')) return Building;
    if (typeLower.includes('office')) return Building2;
    return Building2;
  };

  const getPropertyTypeDescription = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('condo')) return 'Explore condominium projects';
    if (typeLower.includes('house')) return 'Browse house developments';
    if (typeLower.includes('loft')) return 'Discover loft projects';
    if (typeLower.includes('community')) return 'View master-planned communities';
    if (typeLower.includes('office')) return 'Find office spaces';
    return 'Browse available projects';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'platinum-access') return CheckCircle;
    if (status === 'now-selling') return CheckCircle;
    if (status === 'coming-soon') return Clock;
    if (status === 'assignments') return Tag;
    if (status === 'register-now') return Clock;
    if (status === 'resale') return Tag;
    if (status === 'sold-out') return XCircle;
    return Tag;
  };

  const getStatusDescription = (status: string) => {
    if (status === 'platinum-access') return 'Exclusive early access projects';
    if (status === 'now-selling') return 'Projects currently available for purchase';
    if (status === 'coming-soon') return 'Upcoming projects launching soon';
    if (status === 'assignments') return 'Assignment opportunities available';
    if (status === 'register-now') return 'Projects accepting registrations';
    if (status === 'resale') return 'Resale properties available';
    if (status === 'sold-out') return 'Fully sold projects';
    return 'Browse projects by status';
  };

  // Static lists for property types, selling statuses, and occupancy years
  const staticPropertyTypes = [
    'Condos',
    'Houses',
    'Lofts',
    'Master-Planned Communities',
    'Multi Family',
    'Offices'
  ];

  const staticSellingStatuses = [
    'platinum-access',
    'now-selling',
    'coming-soon',
    'assignments',
    'register-now',
    'resale',
    'sold-out'
  ];

  // Generate occupancy years from current year to 6 years ahead
  const currentYear = new Date().getFullYear();
  const staticOccupancyYears = Array.from({ length: 7 }, (_, i) => currentYear + i);

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
              className="bg-white rounded-lg shadow-[0px_15px_30px_0px_rgba(16,24,40,0.1)] p-6 xl:py-8 lg:py-6 pointer-events-auto mt-2"
              style={{
                width: 'min(95vw, 1536px)',
                maxWidth: '1536px'
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <div className="lg:flex justify-between gap-8">
                {/* Left Side - Filter Sections */}
                <div className="lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Property Types */}
                  <div>
                    <h6 className="font-medium text-base text-gray-500">
                      Projects by Property Type
                    </h6>
                    <div className="grid grid-cols-2 gap-0">
                      {staticPropertyTypes.map((type) => {
                        const Icon = getPropertyTypeIcon(type);
                        return (
                          <Link
                            key={type}
                            href={`/pre-construction/${getPropertyTypeSlug(type)}`}
                            className="px-3 py-4 transition-all duration-500 hover:bg-gray-50 hover:rounded-xl flex group cursor-pointer select-text"
                          >
                            <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-gray-50 group-hover:bg-primary/10 transition-colors flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="ml-3 flex-1 min-w-0 select-text">
                              <h5 className="text-gray-900 text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                {formatPropertyType(type)}
                              </h5>
                              <p className="text-xs font-medium text-gray-400 select-text line-clamp-2">
                                {getPropertyTypeDescription(type)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href="/pre-construction/projects"
                      className="flex items-center mt-4 text-xs font-semibold text-primary hover:underline"
                    >
                      Show all property types
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

                  {/* Occupancy Years */}
                  <div>
                    <h6 className="font-medium text-base text-gray-500">
                      Projects by Occupancy Year
                    </h6>
                    <div className="grid grid-cols-4 gap-0">
                      {staticOccupancyYears.map((year) => (
                        <Link
                          key={year}
                          href={`/pre-construction/${year}`}
                          className="px-3 py-4 transition-all duration-500 hover:bg-gray-50 hover:rounded-xl flex flex-col items-center justify-center group cursor-pointer select-text"
                        >
                          <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-gray-50 group-hover:bg-primary/10 transition-colors mb-2">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <h5 className="text-gray-900 text-sm font-semibold group-hover:text-primary transition-colors text-center">
                            Move in {year}
                          </h5>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Selling Status */}
                  <div className="flex-1">
                    <h6 className="font-medium text-base text-gray-500">
                      Projects by Selling Status
                    </h6>
                    <div className="grid grid-cols-3 gap-0">
                      {staticSellingStatuses.map((status) => {
                        const Icon = getStatusIcon(status);
                        return (
                          <Link
                            key={status}
                            href={`/pre-construction/${status}`}
                            className="px-3 py-4 transition-all duration-500 hover:bg-gray-50 hover:rounded-xl flex group cursor-pointer select-text"
                          >
                            <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-gray-50 group-hover:bg-primary/10 transition-colors flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="ml-3 flex-1 min-w-0 select-text">
                              <h5 className="text-gray-900 text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                {formatStatus(status)}
                              </h5>
                              <p className="text-xs font-medium text-gray-400 select-text line-clamp-1">
                                {getStatusDescription(status)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href="/pre-construction/projects"
                      className="flex items-center mt-4 text-xs font-semibold text-primary hover:underline"
                    >
                      Show all selling statuses
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

                  {/* Developers */}
                  <div className="">
                    <h6 className="font-medium text-base text-gray-500">
                      Projects by Developer
                    </h6>
                    <ul className="space-y-1 max-h-96 overflow-y-auto">
                      {filterData.developers.length > 0 ? (
                        filterData.developers.slice(0, 10).map((developer) => (
                          <li key={developer}>
                            <Link
                              href={`/pre-construction?developer=${encodeURIComponent(developer)}`}
                              className="px-3 py-5 transition-all duration-500 hover:bg-gray-50 hover:rounded-xl flex group cursor-pointer select-text"
                            >
                              <div className="rounded-lg w-12 h-12 flex items-center justify-center bg-gray-50 group-hover:bg-primary/10 transition-colors flex-shrink-0">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div className="ml-4 w-4/5 select-text">
                                <h5 className="text-gray-900 text-base mb-1.5 font-semibold group-hover:text-primary transition-colors">
                                  {developer}
                                </h5>
                                <p className="text-xs font-medium text-gray-400 select-text">
                                  View all projects by {developer}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))
                      ) : null}
                    </ul>
                    {filterData.developers.length > 10 && (
                      <Link
                        href="/pre-construction/projects"
                        className="flex items-center mt-4 text-xs font-semibold text-primary hover:underline"
                      >
                        View all developers
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
                    )}
                  </div>
                </div>

                {/* Right Side - Featured Blogs */}
                {fallbackBlogs.length > 0 && (
                  <div className="bg-gray-50 p-8 lg:w-1/3 mt-6 lg:mt-0 rounded-lg">
                    <h6 className="font-medium text-sm text-gray-500 mb-5">
                      Latest News
                    </h6>
                    <div className="space-y-4">
                      {fallbackBlogs.map((blog) => (
                        <Link
                          key={blog.id}
                          href={`/blogs?id=${blog.id}`}
                          className="block group"
                        >
                          <div className="flex gap-3 p-3 hover:bg-white rounded-lg transition-colors">
                            {blog.image && (
                              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                                <Image
                                  src={blog.image}
                                  alt={blog.title}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                {blog.title}
                              </h5>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {blog.excerpt}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href="/blogs"
                        className="flex items-center mt-4 text-xs font-semibold text-primary hover:underline"
                      >
                        View all blogs →
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

