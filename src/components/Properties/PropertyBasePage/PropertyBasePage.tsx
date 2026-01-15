"use client";

import React, { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import type { PropertyBasePageProps } from './types';
import { usePropertyData } from './hooks';
import { LoadingState } from './components/LoadingState';
import { HeroSection } from './components/HeroSection';
import { PropertyListings } from './components/PropertyListings';
import Pagination from '@/components/ui/pagination';

const PropertyBasePage: React.FC<PropertyBasePageProps> = ({ 
  slug, 
  pageType, 
  citySlug,
  listingType,
  locationType,
  locationName,
}) => {
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters, setFilter } = useGlobalFilters();
  
  // Set listing type from props if provided
  React.useEffect(() => {
    if (listingType) {
      setFilter('listingType', listingType);
    }
  }, [listingType, setFilter]);
  

  // Use custom hook for data fetching and filtering
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
    listingType, // Pass listingType directly to hook
  });

  // Update document title and meta tags for SEO
  useEffect(() => {
    const title = pageInfo?.title || '';
    
    if (title) {
      document.title = `${title} | Summitly`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (pageInfo?.description) {
      if (metaDescription) {
        metaDescription.setAttribute('content', pageInfo.description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = pageInfo.description;
        document.head.appendChild(meta);
      }
    }
  }, [pageInfo]);

  if (loading) {
    return <LoadingState />;
  }

  // Use page info or defaults
  const displayTitle = pageInfo?.title || '';
  const propertyCount = pageInfo?.numberOfProperties || 0;
  const province = pageInfo?.province || 'ON';
  const displayCount = propertyCount > 0 ? `${propertyCount}+` : '100+';

  // Get current date for "Last Updated"
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build description
  const description = pageInfo?.description || `Find properties for sale. Browse listings, view photos, and connect with real estate agents.`;

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section with Header */}
      <HeroSection
        heroImage={null}
        title={displayTitle}
        customContent={null}
        lastUpdatedDate={lastUpdatedDate}
        pageType={pageType}
        displayCount={displayCount}
        cityName={parsedParams?.cityName || null}
      />

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        
        {/* Filters */}
        <section>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex justify-between items-center gap-1 w-full">
              <div className="flex-1 w-full lg:w-auto">
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
                  layout="horizontal"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Property Listings */}
        <section className="pb-8">
          <PropertyListings
            properties={properties}
            displayTitle={displayTitle}
            pageType={pageType}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
          
          {/* Pagination - Fallback if infinite scroll doesn't work */}
          {pagination && pagination.totalPages > 1 && !hasMore && (
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
        
        {/* Description Section */}
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
      </main>
    </div>
  );
};

export default PropertyBasePage;

