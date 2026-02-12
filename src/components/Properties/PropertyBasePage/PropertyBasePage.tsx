"use client";

import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import GlobalFilters from "@/components/common/filters/GlobalFilters";
import { LOCATIONS } from "@/lib/types/filters";
import type { PropertyListing } from "@/lib/types";
import type { PropertyBasePageProps } from "./types";
import { usePropertyData } from "./hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCardSkeleton } from "@/components/skeletons";
import { HeroSection } from "./components/HeroSection";
import { NavigationButtons } from "./components/NavigationButtons";
import { ViewModeToggle } from "@/components/common/ViewModeToggle";
import { PropertyListings } from "./components/PropertyListings";
import { MapView } from "./components/MapView";
import { BlogSectionWrapper } from "./components/BlogSectionWrapper";
import { FAQSection } from "./components/FAQSection";
import { PropertyContactSection } from "./components/ContactSection";
import Pagination from "@/components/ui/pagination";

type ViewMode = "list" | "mixed" | "map";

const PropertyBasePage: React.FC<PropertyBasePageProps> = ({
  slug,
  pageType,
  citySlug,
  zipcode,
  listingType,
  locationType,
  locationName,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  const { filters, handleFilterChange, resetFilters, setFilter } = useGlobalFilters();

  React.useEffect(() => {
    if (listingType) {
      setFilter("listingType", listingType);
    }
  }, [listingType, setFilter]);

  const {
    loading,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    pageInfo,
    properties,
    communities,
    parsedParams,
    pagination,
  } = usePropertyData({
    slug,
    pageType,
    citySlug,
    zipcode,
    filters,
    locationType,
    locationName,
    listingType,
  });

  useEffect(() => {
    const title = pageInfo?.title || "";
    if (title) {
      document.title = `${title} | Summitly`;
    }
    const metaDescription = document.querySelector('meta[name="description"]');
    if (pageInfo?.description) {
      if (metaDescription) {
        metaDescription.setAttribute("content", pageInfo.description);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = pageInfo.description;
        document.head.appendChild(meta);
      }
    }
  }, [pageInfo]);

  if (initialLoading) {
    return (
      <div className="">
        <section className="w-full bg-primary text-secondary-foreground mt-16 py-8 md:py-10">
          <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-between">
            <div className="space-y-4">
              <nav className="flex items-center gap-2 mb-4" aria-hidden>
                <Skeleton className="h-4 w-20 bg-white/20 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32 bg-white/20 rounded" />
              </nav>
              <Skeleton className="h-9 w-3/4 bg-white/20 rounded" />
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div className="bg-white/80 rounded-2xl p-5 shadow-sm w-full md:w-auto max-w-sm">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </section>
        <main className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <section>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-wrap gap-2 flex-1">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-44 rounded-lg" />
                <Skeleton className="h-12 w-48 rounded-lg" />
                <Skeleton className="h-12 w-36 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </section>
          <section className="pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const displayTitle = pageInfo?.title || "";
  const province = pageInfo?.province || "ON";

  const lastUpdatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const description =
    pageInfo?.description ||
    "Find properties for sale. Browse listings, view photos, and connect with real estate agents.";

  return (
    <div className="">
      <HeroSection
        heroImage={null}
        title={displayTitle}
        customContent={null}
        lastUpdatedDate={lastUpdatedDate}
        pageType={pageType}
        listingType={listingType}
        cityName={parsedParams?.cityName || null}
      />

      <main className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <NavigationButtons
          pageType={pageType}
          slug={slug}
          displayTitle={displayTitle}
        />

        <section>
          <div className="flex flex-col md:flex-row gap-4">
            <GlobalFilters
              filters={filters}
              handleFilterChange={handleFilterChange}
              resetFilters={resetFilters}
              communities={communities}
              locations={LOCATIONS}
              showLocation={true}
              showPropertyType={!parsedParams?.propertyType}
              showCommunity={false}
              showPrice={!parsedParams?.priceRange}
              showBedrooms={!parsedParams?.bedrooms}
              showBathrooms={!parsedParams?.bathrooms}
              showAdvanced={true}
              showSellRentToggle={false}
              showResetButton={false}
              layout="horizontal"
              className="w-full"
            />
            <ViewModeToggle
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>
        </section>

        <section className="pb-8">
          {!loading && properties.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-semibold text-yellow-800">No properties found</p>
              <p className="text-yellow-700 mt-2">
                Try adjusting your filters or search in a different area.
              </p>
            </div>
          )}

          <div
            className={`flex ${
              viewMode === "map"
                ? "flex-col"
                : viewMode === "list"
                  ? "flex-col"
                  : "flex-col md:flex-row"
            } gap-6`}
          >
            <PropertyListings
              properties={properties}
              displayTitle={displayTitle}
              pageType={pageType}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={false}
              viewMode={viewMode}
              selectedProperty={selectedProperty}
              onPropertySelect={setSelectedProperty}
            />

            <MapView
              viewMode={viewMode}
              mapProperties={properties}
              selectedProperty={selectedProperty}
              onPropertySelect={setSelectedProperty}
            />
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.onPageChange}
                showFirstLast={true}
                showPrevNext={true}
                maxVisiblePages={7}
              />
            </div>
          )}
        </section>

        <Separator />

        {description && (
          <section className="py-6">
            <div className="w-full prose prose-sm max-w-none">
              <div
                className="text-muted-foreground text-base leading-loose"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          </section>
        )}

        <BlogSectionWrapper
          pageType={pageType}
          displayTitle={displayTitle}
          province={province}
          slug={slug}
        />
      </main>

      <FAQSection pageType={pageType} displayTitle={displayTitle} />

      <PropertyContactSection pageType={pageType} displayTitle={displayTitle} />
    </div>
  );
};

export default PropertyBasePage;
