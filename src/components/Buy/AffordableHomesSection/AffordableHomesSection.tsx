'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { RepliersAPI } from '@/lib/api/repliers';
import type { PropertyListing } from '@/lib/types';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyCardSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const LISTINGS_LIMIT = 10;

export default function AffordableHomesSection() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await RepliersAPI.listings.getFiltered({
          status: 'A',
          type: 'Sale',
          resultsPerPage: LISTINGS_LIMIT,
          page: 1,
          sortBy: 'listPriceAsc',
        });
        if (!isMounted) return;
        setListings(result.listings ?? []);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load listings');
          console.error('AffordableHomesSection:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on('select', updateSelection);
    return () => {
      carouselApi.off('select', updateSelection);
    };
  }, [carouselApi]);

  const firstCity = listings[0]?.address?.city;
  const firstState = listings[0]?.address?.state;
  const viewAllLocation =
    firstCity && firstState ? `${firstCity}, ${firstState}` : null;

  return (
    <section className="bg-white py-12 md:py-16" aria-labelledby="affordable-homes-heading">
      <div className="container-1400 mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 id="affordable-homes-heading" className="text-2xl md:text-3xl font-bold text-foreground">
            Affordable Homes
          </h2>
          <Link
            href="/listings"
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-sm shrink-0"
          >
            {viewAllLocation ? `View all in ${viewAllLocation}` : 'View all listings'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <div className="relative min-h-[420px]">
            <Carousel opts={{ align: 'start', loop: false }} className="w-full">
              <CarouselContent className="-ml-1 md:-ml-2 flex items-stretch pb-5 px-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CarouselItem
                    key={i}
                    className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full"
                  >
                    <PropertyCardSkeleton />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : error ? (
          <p className="text-muted-foreground py-8">Unable to load affordable homes. Please try again later.</p>
        ) : listings.length === 0 ? (
          <p className="text-muted-foreground py-8">No listings available at the moment.</p>
        ) : (
          <div className="relative overflow-visible min-h-[420px]">
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 -right-4 md:-right-12 flex justify-between items-center z-10 pointer-events-none">
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
              opts={{ align: 'start', loop: false }}
              className="w-full overflow-visible"
            >
              <CarouselContent className="-ml-1 md:-ml-2 flex items-stretch pb-5 px-5">
                {listings.map((listing) => (
                  <CarouselItem
                    key={listing.mlsNumber}
                    className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full"
                  >
                    <PropertyCard
                      property={{
                        ...listing,
                        listedDate: listing.listDate,
                      }}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}
