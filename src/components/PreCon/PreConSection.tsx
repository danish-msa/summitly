"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { PreConstructionPropertyCardV3 } from './PropertyCards';
import type { PreConstructionProperty } from './PropertyCards/types';
import { PropertyListing } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

// Convert PropertyListing to PreConstructionProperty format
const convertToPreConProperty = (property: PropertyListing): PreConstructionProperty | null => {
  if (!property.preCon) return null;

  const preCon = property.preCon;
  const address = property.address;

  return {
    id: property.mlsNumber,
    projectName: preCon.projectName,
    developer: preCon.developer,
    startingPrice: preCon.startingPrice,
    images: property.images?.allImages || [property.images?.imageUrl || '/images/p1.jpg'],
    address: {
      street: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || address.location?.split(',')[0] || '',
      city: address.city || '',
      province: address.state || '',
      latitude: property.map?.latitude ?? undefined,
      longitude: property.map?.longitude ?? undefined,
    },
    details: {
      propertyType: property.details?.propertyType || preCon.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: typeof preCon.completion.progress === 'string' ? 0 : (preCon.completion.progress || 0),
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};


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
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/pre-con-projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter and convert projects based on filter type
  const filteredProjects = useMemo(() => {
    let filtered: PropertyListing[] = [];

    if (filter.type === 'high-rise-condos') {
      filtered = projects.filter(project => {
        if (!project.preCon) return false;
        const propertyType = project.preCon.details?.propertyType || project.details?.propertyType || '';
        const subPropertyType = project.preCon.details?.subPropertyType || '';
        return (
          (propertyType.toLowerCase().includes('condo') || propertyType.toLowerCase().includes('condominium')) &&
          subPropertyType.toLowerCase() === 'high-rise'
        );
      });
    } else if (filter.type === 'low-rise-condos') {
      filtered = projects.filter(project => {
        if (!project.preCon) return false;
        const propertyType = project.preCon.details?.propertyType || project.details?.propertyType || '';
        const subPropertyType = project.preCon.details?.subPropertyType || '';
        return (
          (propertyType.toLowerCase().includes('condo') || propertyType.toLowerCase().includes('condominium')) &&
          subPropertyType.toLowerCase() === 'low-rise'
        );
      });
    } else if (filter.type === 'closing-this-year') {
      filtered = projects.filter(project => {
        if (!project.preCon) return false;
        const completionDate = project.preCon.completion?.date || '';
        return completionDate.includes(filter.year);
      });
    } else if (filter.type === 'recently-added') {
      filtered = [...projects].sort((a, b) => {
        const dateA = new Date(a.listDate || a.updatedOn || '1970-01-01').getTime();
        const dateB = new Date(b.listDate || b.updatedOn || '1970-01-01').getTime();
        return dateB - dateA; // Newest first
      });
    }

    return filtered
      .slice(0, limit)
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects, filter, limit]);

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
      <section className="py-8 sm:py-12 md:py-16 bg-background">
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
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-sm sm:text-base text-muted-foreground">Loading projects...</div>
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

