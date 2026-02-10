"use client";

import React, { useEffect, useRef } from "react";
import PropertyCard from "@/components/Helper/PropertyCard";
import type { PropertyListing } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { PropertyCardSkeleton } from "@/components/skeletons";

type ViewMode = "list" | "mixed" | "map";

interface PropertyListingsProps {
  properties: PropertyListing[];
  displayTitle: string;
  pageType: string;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  viewMode?: ViewMode;
  selectedProperty?: PropertyListing | null;
  onPropertySelect?: (property: PropertyListing | null) => void;
}

export const PropertyListings: React.FC<PropertyListingsProps> = ({
  properties,
  displayTitle,
  pageType,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  viewMode = "list",
  selectedProperty = null,
  onPropertySelect,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode === "map" || !hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [viewMode, hasMore, loadingMore, onLoadMore]);

  if (viewMode === "map") return null;

  const isMixed = viewMode === "mixed";
  const wrapperClass = isMixed ? "md:w-1/2 overflow-y-auto" : "w-full";
  const gridClass = isMixed
    ? "grid gap-6 grid-cols-1 sm:grid-cols-2"
    : "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  const maxHeight = isMixed ? { maxHeight: "calc(100vh - 200px)" } : undefined;

  return (
    <div className={wrapperClass} style={maxHeight}>
      {properties.length > 0 ? (
        <>
          <div className={gridClass}>
            {properties.map((property) => (
              <div
                key={property.mlsNumber}
                className={
                  onPropertySelect
                    ? `cursor-pointer transition-all h-full ${
                        selectedProperty?.mlsNumber === property.mlsNumber
                          ? "ring-2 ring-primary rounded-lg"
                          : ""
                      }`
                    : "h-full"
                }
                onClick={
                  onPropertySelect
                    ? () =>
                        onPropertySelect(
                          selectedProperty?.mlsNumber === property.mlsNumber
                            ? null
                            : property
                        )
                    : undefined
                }
              >
                <PropertyCard property={property} onHide={() => {}} />
              </div>
            ))}
          </div>
          {hasMore && (
            <div
              ref={observerTarget}
              className="flex justify-center items-center py-8 min-h-[100px]"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span>Loading more properties...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : loading ? (
        <div className={gridClass}>
          {[...Array(8)].map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="bg-secondary/30 rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground">
            No properties found
            {pageType === "by-location" ? ` in ${displayTitle}` : ""}
          </p>
        </div>
      )}
    </div>
  );
};

