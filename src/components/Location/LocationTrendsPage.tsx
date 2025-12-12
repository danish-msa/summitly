"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getListings } from '@/lib/api/properties';
import { PropertyListing } from '@/lib/types';
import { MarketStats } from '@/components/City/MarketStats';
import { Separator } from '@/components/ui/separator';
import { getDateRanges } from '@/components/Location/trends/utils/helpers';
import { PageHeader } from '@/components/Location/trends/components/PageHeader';
import { HousingPricesSection } from '@/components/Location/trends/components/HousingPricesSection';
import { HousingInventorySection } from '@/components/Location/trends/components/HousingInventorySection';
import { RankingSection } from '@/components/Location/trends/components/RankingSection';
import { CityBreakdownSection } from '@/components/Location/trends/components/CityBreakdownSection';
import { PropertyTypeBreakdownSection } from '@/components/Location/trends/components/PropertyTypeBreakdownSection';
import { AboutReportSection } from '@/components/Location/trends/components/AboutReportSection';
import { CTABar } from '@/components/Location/trends/components/CTABar';
import { TrendsFilters } from '@/components/Location/trends/components/TrendsFilters';
import { FilterState, FilterChangeEvent, DEFAULT_FILTER_STATE, LOCATIONS } from '@/lib/types/filters';
import { useMarketTrends } from '@/hooks/useMarketTrends';

// Helper function to convert slug back to name
const unslugifyName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface LocationTrendsPageProps {
  locationType: LocationType;
}

const LocationTrendsPage: React.FC<LocationTrendsPageProps> = ({ locationType }) => {
  const params = useParams();
  const citySlug = (params?.citySlug || params?.cityName) as string || ''; // Support both for backward compatibility
  const areaSlug = (params?.areaName || params?.slug) as string || ''; // Support both for backward compatibility
  const neighbourhoodSlug = (params?.neighbourhoodName || params?.neighbourhood) as string || ''; // Support both for backward compatibility
  
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{ name: string } | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [communities, setCommunities] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number>(5);

  // Determine location names based on type
  const cityName = useMemo(() => {
    return unslugifyName(citySlug);
  }, [citySlug]);

  const areaName = useMemo(() => {
    return areaSlug ? unslugifyName(areaSlug) : '';
  }, [areaSlug]);

  const neighbourhoodName = useMemo(() => {
    return neighbourhoodSlug ? unslugifyName(neighbourhoodSlug) : '';
  }, [neighbourhoodSlug]);

  // Get display name based on location type
  const displayName = useMemo(() => {
    if (locationType === 'neighbourhood') return neighbourhoodName;
    if (locationType === 'area') return areaName;
    return cityName;
  }, [locationType, cityName, areaName, neighbourhoodName]);

  // Build back URL based on location type
  const backUrl = useMemo(() => {
    if (locationType === 'neighbourhood') {
      return `/${citySlug}/${areaSlug}/${neighbourhoodSlug}`;
    } else if (locationType === 'area') {
      return `/${citySlug}/${areaSlug}`;
    }
    return `/${citySlug}`;
  }, [locationType, citySlug, areaSlug, neighbourhoodSlug]);

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        setLoading(true);

        // Fetch properties
        const listingsData = await getListings({
          status: 'A',
          resultsPerPage: 50,
          pageNum: 1,
        });

        // Filter properties by location
        let filtered = listingsData.listings;

        // Always filter by city
        filtered = filtered.filter(property =>
          property.address?.city?.toLowerCase() === cityName.toLowerCase()
        );

        // Filter by area if applicable
        if (locationType === 'area' || locationType === 'neighbourhood') {
          filtered = filtered.filter(property => {
            const propArea = property.address?.area?.toLowerCase() || '';
            const searchArea = areaName.toLowerCase();
            // Use flexible matching: exact match or contains
            return propArea === searchArea || 
                   propArea.includes(searchArea) || 
                   searchArea.includes(propArea);
          });
        }

        // Filter by neighbourhood if applicable
        if (locationType === 'neighbourhood') {
          filtered = filtered.filter(property => {
            const propNeighbourhood = property.address?.neighborhood?.toLowerCase() || '';
            const searchNeighbourhood = neighbourhoodName.toLowerCase();
            // Use flexible matching: exact match or contains
            return propNeighbourhood === searchNeighbourhood || 
                   propNeighbourhood.includes(searchNeighbourhood) || 
                   searchNeighbourhood.includes(propNeighbourhood);
          });
        }

        const locationProperties = filtered;

        setLocationInfo({
          name: displayName,
        });

        setProperties(locationProperties);

        // Extract unique communities from the properties
        const uniqueCommunities = Array.from(
          new Set(
            locationProperties
              .map(property => property.address?.neighborhood)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('Error loading location data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug && (locationType === 'city' || areaSlug)) {
      if (locationType === 'neighbourhood' && !neighbourhoodSlug) {
        return;
      }
      loadLocationData();
    }
  }, [citySlug, areaSlug, neighbourhoodSlug, locationType, cityName, areaName, neighbourhoodName, displayName]);

  const displayLocationName = locationInfo?.name || displayName;
  // Calculate date ranges based on selected years - updates when selectedYears changes
  const dateRanges = useMemo(() => getDateRanges(selectedYears), [selectedYears]);

  // Handle filter changes
  const handleFilterChange = (e: FilterChangeEvent) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate date range based on selected years
  const getDateRangeForYears = (years: number) => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - years);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  };

  // Map property type filter to API format
  const getPropertyTypeForAPI = (propertyType: string): string | undefined => {
    if (propertyType === 'all') return undefined;
    // Map to Repliers API property types
    const mapping: Record<string, string> = {
      'house': 'Detached',
      'condo': 'Condo Apartment',
      'townhouse': 'Condo Townhouse',
      'apartment': 'Condo Apartment',
    };
    return mapping[propertyType];
  };

  // Get effective location based on filters
  const getEffectiveLocation = () => {
    // If location filter is set and not 'all', use it
    if (filters.location !== 'all') {
      // Find location from LOCATIONS
      const location = LOCATIONS.find(loc => loc.id === filters.location);
      if (location) {
        return {
          locationType: 'city' as LocationType,
          locationName: location.name,
          parentCity: undefined,
          parentArea: filters.locationArea !== 'all' ? filters.locationArea : undefined,
        };
      }
    }
    
    // Otherwise use URL-based location
    return {
      locationType,
      locationName: displayLocationName,
      parentCity: locationType !== 'city' ? cityName : undefined,
      parentArea: locationType === 'neighbourhood' || locationType === 'intersection' || locationType === 'community' ? areaName : undefined,
      parentNeighbourhood: locationType === 'intersection' || locationType === 'community' ? neighbourhoodName : undefined,
    };
  };

  const effectiveLocation = getEffectiveLocation();

  // Centralized data fetching - ONE API call for all components
  const { data: marketTrendsData, loading: marketTrendsLoading, error: marketTrendsError, refresh: refreshMarketTrends } = useMarketTrends({
    locationType: effectiveLocation.locationType,
    locationName: effectiveLocation.locationName,
    parentCity: effectiveLocation.parentCity,
    parentArea: effectiveLocation.parentArea,
    parentNeighbourhood: effectiveLocation.parentNeighbourhood,
    propertyType: getPropertyTypeForAPI(filters.propertyType),
    community: filters.community !== 'all' ? filters.community : undefined,
    years: selectedYears,
  });

  // Show loading state if either properties or market trends are loading
  if (loading || marketTrendsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading market trends...</p>
        </div>
      </div>
    );
  }

  // Show error state if market trends failed to load
  if (marketTrendsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="text-red-600 mb-4">Error loading market trends: {marketTrendsError}</p>
          <button
            onClick={() => refreshMarketTrends()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <PageHeader cityName={displayLocationName} citySlug={backUrl} backLabel={`Back to ${displayLocationName} Page`} />

      {/* Filters Section */}
      <TrendsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        communities={communities}
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
      />
      
      {/* Housing Prices Section */}
      <HousingPricesSection 
        locationType={effectiveLocation.locationType}
        locationName={effectiveLocation.locationName}
        parentCity={effectiveLocation.parentCity}
        parentArea={effectiveLocation.parentArea}
        parentNeighbourhood={effectiveLocation.parentNeighbourhood}
        properties={properties}
        dateRanges={dateRanges}
        propertyType={getPropertyTypeForAPI(filters.propertyType)}
        community={filters.community !== 'all' ? filters.community : undefined}
        years={selectedYears}
        marketTrendsData={marketTrendsData}
        onRefresh={refreshMarketTrends}
      />
      <Separator />

      {/* Housing Inventory Section */}
      <HousingInventorySection 
        locationType={effectiveLocation.locationType}
        locationName={effectiveLocation.locationName}
        parentCity={effectiveLocation.parentCity}
        parentArea={effectiveLocation.parentArea}
        parentNeighbourhood={effectiveLocation.parentNeighbourhood}
        dateRanges={dateRanges}
        propertyType={getPropertyTypeForAPI(filters.propertyType)}
        community={filters.community !== 'all' ? filters.community : undefined}
        years={selectedYears}
        marketTrendsData={marketTrendsData}
        onRefresh={refreshMarketTrends}
      />
      <Separator />

      {/* City Breakdown Section - Only show for cities */}
      {locationType === 'city' && (
        <>
          <CityBreakdownSection 
            locationType={locationType}
            locationName={displayLocationName}
          />
          <Separator />
        </>
      )}

      {/* Property Type Breakdown Section - Only show for cities */}
      {locationType === 'city' && (
        <>
          <PropertyTypeBreakdownSection 
            locationType={locationType}
            locationName={displayLocationName}
          />
          <Separator />
        </>
      )}

      {/* Ranking Section - Only show for cities */}
      {locationType === 'city' && (
        <>
          <RankingSection 
            locationType={locationType}
            locationName={displayLocationName}
          />
          <Separator />
        </>
      )}
      <Separator />

      {/* CTA Bar */}
      <CTABar />

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        {/* Market Stats - Market Value Change */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Market Value Change in {displayLocationName}
          </h2>
          <MarketStats 
            cityName={effectiveLocation.locationName} 
            locationType={effectiveLocation.locationType}
            locationName={effectiveLocation.locationName}
            parentCity={effectiveLocation.parentCity}
            parentArea={effectiveLocation.parentArea}
            parentNeighbourhood={effectiveLocation.parentNeighbourhood}
            propertyType={getPropertyTypeForAPI(filters.propertyType)}
            community={filters.community !== 'all' ? filters.community : undefined}
            years={selectedYears}
            marketTrendsData={marketTrendsData}
            onRefresh={refreshMarketTrends}
          />
        </section>
        <Separator />

        {/* About this Report Section */}
        <AboutReportSection 
          cityName={displayLocationName}
          dateRange={dateRanges.current}
        />
      </main>
    </div>
  );
};

export default LocationTrendsPage;

