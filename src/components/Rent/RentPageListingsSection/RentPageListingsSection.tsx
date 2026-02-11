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

/** When using a client-side filter, fetch this many so we have enough after filtering */
const FETCH_SIZE_WITH_FILTER = 50;

/** Repliers listing type for rentals (same as PropertyBasePage rent filter) */
const RENT_LISTING_TYPE = 'Lease';

/** Repliers sortBy must be one of their enum values (includes direction). Newest by list date = statusAscListDateDesc */
const SORT_NEWEST = 'statusAscListDateDesc';

export interface RentPageListingsSectionProps {
  /** Unique id for the section heading (a11y) */
  headingId: string;
  /** Section title (e.g. "Newest listings") */
  title: string;
  /** "View all" link href (default: /listings?listingType=rent) */
  viewAllHref?: string;
  /** Optional "View all in {location}" label override */
  viewAllLabel?: string;
  /** Repliers sortBy enum (e.g. statusAscListDateDesc for newest). Omit for default order. */
  sortBy?: string;
  /** Optional client-side filter (e.g. pet-friendly via condominium.pets). When set, we fetch more results then filter. */
  filterListings?: (listing: PropertyListing) => boolean;
}

export default function RentPageListingsSection({
  headingId,
  title,
  viewAllHref = '/listings?listingType=rent',
  viewAllLabel,
  sortBy,
  filterListings,
}: RentPageListingsSectionProps) {
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
        const resultsPerPage = filterListings ? FETCH_SIZE_WITH_FILTER : LISTINGS_LIMIT;
        const params: Parameters<typeof RepliersAPI.listings.getFiltered>[0] = {
          status: 'A',
          type: RENT_LISTING_TYPE,
          resultsPerPage,
          page: 1,
        };
        if (sortBy) {
          params.sortBy = sortBy;
        }
        const result = await RepliersAPI.listings.getFiltered(params);
        if (!isMounted) return;
        let list = result.listings ?? [];
        if (filterListings) {
          list = list.filter(filterListings).slice(0, LISTINGS_LIMIT);
        }
        setListings(list);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load listings');
          console.error('RentPageListingsSection:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [sortBy, filterListings]);

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
  const resolvedViewAllLabel =
    viewAllLabel ?? (firstCity && firstState ? `View all in ${firstCity}, ${firstState}` : 'View all rentals');

  if (error) return null;

  return (
    <section className="bg-white py-12 md:py-16" aria-labelledby={headingId}>
      <div className="container-1400 mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 id={headingId} className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-sm shrink-0"
          >
            {resolvedViewAllLabel}
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
        ) : listings.length === 0 ? null : (
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
