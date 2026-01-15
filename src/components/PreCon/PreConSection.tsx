"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from './PropertyCards';
import type { PreConstructionProperty } from './PropertyCards/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { PreConstructionCardSkeleton } from '@/components/skeletons';
import { convertApiV1ToPreConProperty, type ApiV1Project } from '@/components/PreCon/PreConstructionBasePage/utils';


type FilterType = 
  | { type: 'high-rise-condos' }
  | { type: 'low-rise-condos' }
  | { type: 'closing-this-year'; year: string }
  | { type: 'recently-added' };

interface PreConSectionProps {
  heading: string;
  subheading: string;
  description: string;
  filter: FilterType;
  viewAllLink?: string;
  limit?: number;
}

const PreConSection: React.FC<PreConSectionProps> = ({
  heading,
  subheading: _subheading,
  description,
  filter,
  viewAllLink,
  limit = 10,
}) => {
  const [projects, setProjects] = useState<ApiV1Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { api } = await import('@/lib/api/client');
        // API client automatically adds /api/v1 prefix, so just use the endpoint path
        const response = await api.get<{ projects: ApiV1Project[] }>('/pre-con-projects', {
          params: { limit: 1000 } // Fetch more projects to ensure we have enough for filtering
        });
        
        if (response.success && response.data) {
          const fetchedProjects = response.data.projects || [];
          console.log(`[PreConSection: ${heading}] Fetched ${fetchedProjects.length} projects`);
          setProjects(fetchedProjects);
        } else {
          console.warn(`[PreConSection: ${heading}] API response was not successful:`, response);
        }
      } catch (error) {
        console.error(`[PreConSection: ${heading}] Error fetching projects:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [heading]);

  // Filter and convert projects based on filter type
  const filteredProjects = useMemo(() => {
    let filtered: ApiV1Project[] = [];

    if (filter.type === 'high-rise-condos') {
      filtered = projects.filter(project => {
        const propertyType = (project.details?.propertyType || '').toLowerCase();
        const subPropertyType = (project.details?.subPropertyType || '').toLowerCase();
        const isCondo = propertyType.includes('condo') || propertyType.includes('condominium');
        const isHighRise = subPropertyType.includes('high-rise') || subPropertyType.includes('highrise') || subPropertyType === 'high-rise';
        return isCondo && isHighRise;
      });
    } else if (filter.type === 'low-rise-condos') {
      filtered = projects.filter(project => {
        const propertyType = (project.details?.propertyType || '').toLowerCase();
        const subPropertyType = (project.details?.subPropertyType || '').toLowerCase();
        const isCondo = propertyType.includes('condo') || propertyType.includes('condominium');
        const isLowRise = subPropertyType.includes('low-rise') || subPropertyType.includes('lowrise') || subPropertyType === 'low-rise';
        return isCondo && isLowRise;
      });
    } else if (filter.type === 'closing-this-year') {
      filtered = projects.filter(project => {
        const completionDate = project.completion?.date || '';
        return completionDate.includes(filter.year);
      });
    } else if (filter.type === 'recently-added') {
      // For recently added, we'll sort by a timestamp if available, otherwise keep original order
      filtered = [...projects];
    }

    const converted = filtered
      .slice(0, limit)
      .map(convertApiV1ToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
    
    console.log(`[PreConSection: ${heading}] Filter type: ${filter.type}, Filtered: ${filtered.length}, Converted: ${converted.length}`);
    
    return converted;
  }, [projects, filter, limit, heading]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);


  if (loading) {
    return (
      <section className="py-6 sm:py-8 md:py-10 bg-background">
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-primary">{heading}</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{description}</p>
            </div>
            {viewAllLink && (
              <Link href={viewAllLink} className="whitespace-nowrap sm:pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  View All
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-6 sm:mt-8 md:mt-12 relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                breakpoints: {
                  "(max-width: 768px)": {
                    dragFree: true,
                  },
                },
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-1 sm:-ml-2 md:-ml-4">
                {[...Array(Math.min(limit, 8))].map((_, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-1 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <PreConstructionCardSkeleton />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </section>
    );
  }

  if (filteredProjects.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 md:py-10 bg-background">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-primary">{heading}</h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{description}</p>
          </div>
          {viewAllLink && (
            <Link href={viewAllLink} className="whitespace-nowrap sm:pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                View All
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-12 relative">
          {/* Navigation Buttons - Positioned above the carousel */}
          <div className="absolute -top-8 sm:-top-10 right-0 flex gap-1 justify-between items-center z-10 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-secondary/95 text-white backdrop-blur-sm shadow-lg border border-border hover:bg-primary hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
              aria-label="Previous slide"
            >
              <ArrowLeft className="h-4 w-4 sm:h-6 sm:w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-secondary/95 text-white backdrop-blur-sm shadow-lg border border-border hover:bg-primary hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
              aria-label="Next slide"
            >
              <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6" />
            </Button>
          </div>

          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "start",
              loop: true,
              breakpoints: {
                "(max-width: 768px)": {
                  dragFree: true,
                },
              },
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1 sm:-ml-2 md:-ml-4">
              {filteredProjects.map((property) => (
                <CarouselItem
                  key={property.id}
                  className="pl-1 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <PreConstructionPropertyCardV3
                    property={property}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default PreConSection;

