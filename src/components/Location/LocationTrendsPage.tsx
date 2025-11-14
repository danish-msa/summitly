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
import { AboutReportSection } from '@/components/Location/trends/components/AboutReportSection';
import { CTABar } from '@/components/Location/trends/components/CTABar';

// Helper function to convert slug back to name
const unslugifyName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export type LocationType = 'city' | 'area' | 'neighbourhood';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading market trends...</p>
        </div>
      </div>
    );
  }

  const displayLocationName = locationInfo?.name || displayName;
  const dateRanges = getDateRanges();

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <PageHeader cityName={displayLocationName} citySlug={backUrl} backLabel={`Back to ${displayLocationName} Page`} />

      {/* Housing Prices Section */}
      <HousingPricesSection 
        cityName={displayLocationName}
        properties={properties}
        dateRanges={dateRanges}
      />
      <Separator />

      {/* Housing Inventory Section */}
      <HousingInventorySection 
        cityName={displayLocationName}
        dateRanges={dateRanges}
      />
      <Separator />

      {/* Ranking Section */}
      <RankingSection cityName={displayLocationName} />
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
          <MarketStats cityName={displayLocationName} properties={properties} />
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

