"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import type { PreConstructionBasePageProps } from './types';
import { usePreConProjectsData } from './hooks';
import { LoadingState } from './components/LoadingState';
import { HeroSection } from './components/HeroSection';
import { NavigationButtons } from './components/NavigationButtons';
import { ViewModeToggle } from './components/ViewModeToggle';
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
  bedroomFilter,
  bathroomFilter,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'mixed' | 'map'>('list');
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters, setFilter } = useGlobalFilters();

  // Set bedroom/bathroom filters from URL if provided
  React.useEffect(() => {
    if (bedroomFilter) {
      console.log('[PreConstructionBasePage] Setting bedroom filter from URL:', bedroomFilter);
      setFilter('bedrooms', bedroomFilter.bedrooms);
    }
    if (bathroomFilter) {
      console.log('[PreConstructionBasePage] Setting bathroom filter from URL:', bathroomFilter);
      setFilter('bathrooms', bathroomFilter.bathrooms);
    }
  }, [bedroomFilter, bathroomFilter, setFilter]);

  // Use custom hook for data fetching and filtering
  const {
    loading,
    loadingMore,
    hasMore,
    loadMore,
    pageInfo,
    pageContent,
    communities,
    preConProjects,
    mapProperties,
    teamMemberInfo,
  } = usePreConProjectsData({ slug, pageType, filters, teamType, locationType, locationName });

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

  if (loading) {
    return <LoadingState />;
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
    } else if (pageType === 'subPropertyType' || pageType === 'completionYear') {
      return pageInfo?.description || `Explore ${displayTitle.toLowerCase()} pre-construction projects. Discover new developments and find your ideal property.`;
    } else {
      return pageInfo?.description || '';
    }
  };

  return (
    <div className="min-h-screen pt-16">
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
            <div className="flex-1">
              <GlobalFilters
                filters={filters}
                handleFilterChange={handleFilterChange}
                resetFilters={resetFilters}
                communities={communities}
                locations={LOCATIONS}
                showLocation={false}
                showPropertyType={true}
                showCommunity={false}
                showPrice={true}
                showBedrooms={false}
                showBathrooms={false}
                showAdvanced={true}
                showSellRentToggle={false}
                layout="horizontal"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Project Listings */}
        <section className="pb-8">
          <ViewModeToggle 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
          />
          
          {/* Show message if no projects but not loading */}
          {!loading && preConProjects.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-semibold text-yellow-800">No projects found</p>
              <p className="text-yellow-700 mt-2">
                Debug: pageType={pageType}, slug={slug}, projects.length={preConProjects.length}
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Check browser console for API call details
              </p>
            </div>
          )}

          {/* View Content */}
          <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
            {/* Project Listings */}
            <ProjectListings
              projects={preConProjects}
              viewMode={viewMode}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              displayTitle={displayTitle}
              pageType={pageType}
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

