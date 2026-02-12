"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import type { PreConstructionBasePageProps } from './types';
import { usePreConProjectsData } from './hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { PreConstructionCardSkeleton } from '@/components/skeletons';
import { HeroSection } from './components/HeroSection';
import { NavigationButtons } from './components/NavigationButtons';
import { ViewModeToggle, type ViewMode } from './components/ViewModeToggle';
import { ProjectListings } from './components/ProjectListings';
import { MapView } from './components/MapView';
import { BlogSectionWrapper } from './components/BlogSectionWrapper';
import { FAQSection } from './components/FAQSection';
import { PreConContactSection } from './components/ContactSection';

const PreConstructionBasePage: React.FC<PreConstructionBasePageProps> = ({ 
  slug, 
  pageType, 
  teamType,
  locationType,
  locationName,
  zipcode,
  bedroomFilter,
  bathroomFilter,
  priceRangeFilter,
  sqftFilter,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters, setFilter } = useGlobalFilters();

  // Set filters from URL if provided
  React.useEffect(() => {
    if (bedroomFilter) {
      console.log('[PreConstructionBasePage] Setting bedroom filter from URL:', bedroomFilter);
      setFilter('bedrooms', bedroomFilter.bedrooms);
    }
    if (bathroomFilter) {
      console.log('[PreConstructionBasePage] Setting bathroom filter from URL:', bathroomFilter);
      setFilter('bathrooms', bathroomFilter.bathrooms);
    }
    if (priceRangeFilter) {
      console.log('[PreConstructionBasePage] Setting price range filter from URL:', priceRangeFilter);
      if (priceRangeFilter.min !== undefined) {
        setFilter('minPrice', priceRangeFilter.min);
      }
      if (priceRangeFilter.max !== undefined) {
        setFilter('maxPrice', priceRangeFilter.max);
      }
    }
    if (sqftFilter) {
      console.log('[PreConstructionBasePage] Setting sqft filter from URL:', sqftFilter);
      if (sqftFilter.min !== undefined) {
        setFilter('minSquareFeet', sqftFilter.min);
      }
      if (sqftFilter.max !== undefined) {
        setFilter('maxSquareFeet', sqftFilter.max);
      }
    }
  }, [bedroomFilter, bathroomFilter, priceRangeFilter, sqftFilter, setFilter]);

  // Use custom hook for data fetching and filtering
  const {
    loading,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    pageInfo,
    pageContent,
    communities,
    preConProjects,
    mapProperties,
    teamMemberInfo,
  } = usePreConProjectsData({ slug, pageType, filters, teamType, locationType, locationName, zipcode });

  // Find selected property for map
  const selectedPropertyForMap = useMemo(() => {
    if (!selectedProject) return null;
    return mapProperties.find(p => p.mlsNumber === selectedProject.id) || null;
  }, [selectedProject, mapProperties]);

  // Update document title and meta tags for SEO
  useEffect(() => {
    const title = pageContent?.title || pageInfo?.title || '';
    const metaTitle = pageContent?.metaTitle;
    
    if (metaTitle) {
      document.title = metaTitle;
    } else if (title) {
      document.title = `${title} | Summitly`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (pageContent?.metaDescription) {
      if (metaDescription) {
        metaDescription.setAttribute('content', pageContent.metaDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = pageContent.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [pageContent, pageInfo]);

  // Skeleton only on first load; filter changes keep the page visible
  if (initialLoading) {
    return (
      <div className="">
        <section className="w-full bg-primary text-secondary-foreground mt-16 py-8 md:py-10">
          <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-between">
            <div className="space-y-4">
              <nav className="flex items-center gap-2 mb-4" aria-hidden>
                <Skeleton className="h-4 w-24 bg-white/20 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32 bg-white/20 rounded" />
              </nav>
              <Skeleton className="h-9 w-3/4 bg-white/20 rounded" />
              <Skeleton className="h-12 w-full max-w-md bg-white/20 rounded-lg" />
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
                <PreConstructionCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Use custom content if available and published, otherwise use default
  const displayTitle = pageContent?.title || pageInfo?.title || '';
  const projectCount = pageInfo?.numberOfProjects || 0;
  const province = pageInfo?.province || 'ON';
  const displayCount = projectCount > 0 ? `${projectCount}+` : '120+';

  // Get current date for "Last Updated"
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build description based on page type - use custom content if available
  const buildDescription = () => {
    // If custom description exists, use it
    if (pageContent?.description) {
      return pageContent.description;
    }
    
    // Otherwise use default descriptions
    if (pageType === 'by-location') {
      return `${displayCount} Pre construction Homes in ${displayTitle}, ${province} | Explore Floor Plans, Pricing & Availability. Summitly has over ${displayCount.toLowerCase()} pre construction homes from trusted builders in ${displayTitle}, ${province}. If you are looking to buy resale homes, Summitly is your trusted platform to find 1000+ homes for sale in ${displayTitle}. Whether you are looking to downsize to buy townhomes for sale in ${displayTitle} or looking to buy condos in ${displayTitle} for your family or browsing ${displayTitle} detached homes for sale, our platform is updated daily with latest resale listings every hour. For new development homes, easily filter by number of bedrooms (1 to 4+), project type, and construction status from budget-friendly condo to a pre construction homes, contact us to connect you to the most exciting real estate opportunities in ${displayTitle}.`;
    } else if (pageType === 'subPropertyType') {
      return pageInfo?.description || `Explore ${displayTitle.toLowerCase()} pre-construction projects. Discover new developments and find your ideal property.`;
    } else if (pageType === 'completionYear') {
      // Use the description from pageInfo which includes city if available
      return pageInfo?.description || `Explore pre-construction projects completing in ${displayTitle}. Discover new developments and find your ideal property.`;
    } else {
      return pageInfo?.description || '';
    }
  };

  return (
    <div className="">
      {/* Hero Section with Header */}
      <HeroSection
        heroImage={pageContent?.heroImage || teamMemberInfo?.image || null}
        title={displayTitle}
        customContent={pageContent?.customContent || null}
        lastUpdatedDate={lastUpdatedDate}
        pageType={pageType}
        teamMemberInfo={teamMemberInfo}
      />

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        
        {/* Navigation Buttons */}
        <NavigationButtons 
          pageType={pageType} 
          slug={slug} 
          displayTitle={displayTitle} 
        />
        {/* Filters */}
        <section>
          <div className="flex flex-col md:flex-row gap-4">
            <GlobalFilters
              filters={filters}
              handleFilterChange={handleFilterChange}
              resetFilters={resetFilters}
              communities={communities}
              locations={LOCATIONS}
              showLocation={false}
              showPropertyType={false}
              showCommunity={false}
              showPrice={true}
              showBedrooms={true}
              showBathrooms={true}
              showAdvanced={true}
              isPreCon={true}
              showPreConStatus={true}
              showOccupancyDate={false}
              showDeveloper={false}
              showSellRentToggle={false}
              showResetButton={true}
              layout="horizontal"
              className="w-full"
            />
            <ViewModeToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
            />
          </div>
        </section>

        {/* Project Listings */}
        <section className="pb-8">
          
          
          {/* View Content - when map-only, let map fill width and height */}
          <div
            className={`flex gap-6 ${
              viewMode === 'map'
                ? 'flex-col w-full min-h-[calc(100vh_-_200px)]'
                : viewMode === 'list'
                  ? 'flex-col'
                  : 'flex-col md:flex-row'
            }`}
          >
            {/* Project Listings */}
            <ProjectListings
              projects={preConProjects}
              viewMode={viewMode}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              displayTitle={displayTitle}
              pageType={pageType}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />

            {/* Map View */}
            <MapView
              viewMode={viewMode}
              mapProperties={mapProperties}
              selectedProperty={selectedPropertyForMap}
              selectedProject={selectedProject}
              onPropertySelect={() => {}}
              preConProjects={preConProjects}
              onProjectSelect={setSelectedProject}
            />
          </div>
        </section>
        <Separator />
        {/* Description Section */}
        {buildDescription() && (
          <section className="py-6">
            <div className="w-full prose prose-sm max-w-none">
              <div 
                className="text-muted-foreground text-base leading-loose"
                dangerouslySetInnerHTML={{ __html: buildDescription() }}
              />
            </div>
          </section>
        )}

        {/* Blog Section */}
        <BlogSectionWrapper
          pageType={pageType}
          displayTitle={displayTitle}
          province={province}
          slug={slug}
        />
      </main>

      {/* FAQ Section */}
      <FAQSection
        pageType={pageType}
        displayTitle={displayTitle}
        customFaqs={pageContent?.faqs || null}
      />

      {/* Contact Section */}
      <PreConContactSection
        pageType={pageType}
        displayTitle={displayTitle}
      />
    </div>
  );
};

export default PreConstructionBasePage;

