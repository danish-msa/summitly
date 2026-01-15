"use client";

import React, { useEffect, useRef } from 'react';
import PropertyCard from '@/components/Helper/PropertyCard';
import type { PropertyListing } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface PropertyListingsProps {
  properties: PropertyListing[];
  displayTitle: string;
  pageType: string;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const PropertyListings: React.FC<PropertyListingsProps> = ({
  properties,
  displayTitle,
  pageType,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Trigger 100px before the element comes into view
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div className="w-full">
      {properties.length > 0 ? (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => (
              <div key={property.mlsNumber}>
                <PropertyCard
                  property={property}
                  onHide={() => {}}
                />
              </div>
            ))}
          </div>
          
          {/* Load More Trigger */}
          {hasMore && (
            <div 
              ref={observerTarget} 
              className="flex justify-center items-center py-8 min-h-[100px]"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more properties...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-secondary/30 rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground">
            No properties found{pageType === 'by-location' ? ` in ${displayTitle}` : ''}
          </p>
        </div>
      )}
    </div>
  );
};

