"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { FeaturedPropertyCard } from '../PropertyCards';
import type { PreConstructionProperty } from '../PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import { PropertyListing } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { convertToPreConProperty } from '@/components/PreCon/PreConstructionBasePage/utils';

const FeaturedProjects: React.FC = () => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { api } = await import('@/lib/api/client');
        const response = await api.get<{ projects: PropertyListing[] }>('/pre-con-projects', {
          params: { featured: 'true', limit: 2 },
        });
        
        if (response.success && response.data) {
          setProjects(response.data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching featured projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Convert featured projects (already filtered by API)
  const featuredProperties = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects]);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-background">
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            heading="Our Top Picks"
            subheading="Featured Projects"
            description="Discover our handpicked selection of premium pre-construction properties"
            position="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-12">
            {[...Array(2)].map((_, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border cursor-pointer h-full w-full flex flex-col md:flex-row"
              >
                {/* Image Section - Left */}
                <div className="relative overflow-hidden bg-muted flex-shrink-0 w-full md:w-2/5 h-48 sm:h-56 md:h-full">
                  <Skeleton className="w-full h-full" />
                  
                  {/* Property Type Badge Skeleton - Top Left */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  
                  {/* Featured Badge Skeleton - Top Right */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  
                  {/* Heart Button Skeleton - Top Right Below Badge */}
                  <div className="absolute top-12 right-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                  
                  {/* Address Overlay Skeleton - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
                    <div className="flex items-start">
                      <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full mr-1.5 sm:mr-2 mt-0.5" />
                      <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                    </div>
                  </div>
                </div>
                
                {/* Content Section - Right */}
                <div className="p-3 sm:p-4 md:p-6 flex flex-col flex-1">
                  {/* Top Section */}
                  <div className="flex-1">
                    {/* Status Badge Skeleton */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </div>
                    
                    {/* Project Name and Price Row - Mobile */}
                    <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2 md:hidden">
                      <Skeleton className="h-5 w-32 flex-1" />
                      <div className="flex-shrink-0 text-right">
                        <Skeleton className="h-2.5 w-16 mb-0.5 ml-auto" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </div>
                    </div>
                    
                    {/* Project Name Skeleton - Desktop */}
                    <Skeleton className="hidden md:block h-7 w-48 mb-1.5 sm:mb-2" />
                    
                    {/* Developer Skeleton */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded" />
                      <Skeleton className="h-3 sm:h-4 w-24" />
                    </div>
                    
                    {/* Property Details Skeleton */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded" />
                        <Skeleton className="h-3 sm:h-4 w-16" />
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded" />
                        <Skeleton className="h-3 sm:h-4 w-14" />
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded" />
                        <Skeleton className="h-3 sm:h-4 w-20" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Section - Desktop Only */}
                  <div className="hidden md:flex items-end justify-between gap-4">
                    {/* Price Skeleton */}
                    <div className="flex-shrink-0 min-w-0">
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    
                    {/* CTA Button Skeleton */}
                    <Skeleton className="h-10 w-40 rounded-lg" />
                  </div>
                  
                  {/* CTA Button Skeleton - Mobile Only */}
                  <Skeleton className="md:hidden h-9 w-full rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Our Top Picks"
          subheading="Featured Projects"
          description="Discover our handpicked selection of premium pre-construction properties"
          position="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-12">
          {featuredProperties.map((property) => (
            <FeaturedPropertyCard
              key={property.id}
              property={property}
              onHide={() => {}}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;

