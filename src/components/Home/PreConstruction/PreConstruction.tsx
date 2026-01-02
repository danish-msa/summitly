"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import SectionHeading from '@/components/Helper/SectionHeading';
import Link from 'next/link';
import { PropertyListing } from '@/lib/types';
import { convertToPreConProperty } from '@/components/PreCon/PreConstructionBasePage/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PreConstructionCardSkeleton } from "@/components/skeletons";

const PreConstruction: React.FC = () => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Fetch pre-construction projects from backend
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch featured projects first, fallback to recent projects
        const response = await fetch('/api/pre-con-projects?limit=4&featured=true', {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch pre-construction projects');
        }

        const data = await response.json();
        let fetchedProjects = data.projects || [];

        // If we don't have enough featured projects, fetch recent ones
        if (fetchedProjects.length < 4 && !controller.signal.aborted && isMounted) {
          const recentResponse = await fetch('/api/pre-con-projects?limit=4', {
            signal: controller.signal,
          });
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            const recentProjects = recentData.projects || [];
            
            // Merge featured and recent, avoiding duplicates
            const existingMlsNumbers = new Set(fetchedProjects.map((p: PropertyListing) => p.mlsNumber));
            const additionalProjects = recentProjects.filter(
              (p: PropertyListing) => !existingMlsNumbers.has(p.mlsNumber)
            );
            
            fetchedProjects = [...fetchedProjects, ...additionalProjects].slice(0, 4);
          }
        }

        if (!controller.signal.aborted && isMounted) {
          setProjects(fetchedProjects);
        }
      } catch (err) {
        if (!controller.signal.aborted && isMounted) {
          console.error('Error fetching pre-construction projects:', err);
          setError(err instanceof Error ? err.message : 'Failed to load projects');
          setProjects([]);
        }
      } finally {
        if (!controller.signal.aborted && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();
    
    // Cleanup: abort fetch on unmount
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Convert PropertyListing to PreConstructionProperty format
  const preConstructionProjects = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects]);

  // Handle carousel API updates
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

  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          heading="Pre-Construction Projects"
          subheading="Coming Soon"
          description="Discover exciting pre-construction opportunities across Canada"
          position="center"
        />

        {/* Pre-Construction Card Skeleton Component */}
        {loading && (
          <div className="mt-8 sm:mt-12 relative">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-1 md:-ml-2">
                {[...Array(4)].map((_, index) => (
                  <CarouselItem 
                    key={index}
                    className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <PreConstructionCardSkeleton />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center py-12">
            <div className="text-base sm:text-lg text-red-600">Error: {error}</div>
          </div>
        )}

        {!loading && !error && preConstructionProjects.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-base sm:text-lg text-gray-600 text-center px-4">No pre-construction projects available at this time.</div>
          </div>
        )}

        {!loading && !error && preConstructionProjects.length > 0 && (
          <>
            <div className="mt-8 sm:mt-12 relative">
              {/* Navigation Buttons */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-12 -right-12 flex gap-1 justify-between items-center z-10 pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => carouselApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                  className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => carouselApi?.scrollNext()}
                  disabled={!canScrollNext}
                  className="h-10 w-10 rounded-full bg-white/95 text-primary backdrop-blur-sm shadow-lg border border-border hover:bg-white hover:shadow-xl transition-all duration-300 hidden md:flex pointer-events-auto"
                  aria-label="Next slide"
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>

              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-1 md:-ml-2">
                  {preConstructionProjects.map((project) => (
                    <CarouselItem 
                      key={project.id}
                      className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                    >
                      <PreConstructionPropertyCardV3
                        property={project}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            <div className="text-center mt-8 sm:mt-10">
              <Link
                href="/pre-con/projects"
                className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/90 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
              >
                View All Pre-Construction Projects
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PreConstruction;

