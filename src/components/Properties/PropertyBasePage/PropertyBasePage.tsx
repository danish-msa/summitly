"use client";

import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import GlobalFilters from "@/components/common/filters/GlobalFilters";
import { LOCATIONS } from "@/lib/types/filters";
import type { PropertyListing } from "@/lib/types";
import type { PropertyBasePageProps } from "./types";
import { usePropertyData } from "./hooks";
import { LoadingState } from "./components/LoadingState";
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

  if (loading) {
    return <LoadingState />;
  }

  const displayTitle = pageInfo?.title || "";
  const propertyCount = pageInfo?.numberOfProperties || 0;
  const displayCount = propertyCount > 0 ? `${propertyCount}+` : "100+";
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
        displayCount={displayCount}
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
              loadingMore={loading}
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
