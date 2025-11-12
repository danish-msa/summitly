"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getListings } from '@/lib/api/properties';
import { PropertyListing } from '@/lib/types';
import { MarketStats } from '@/components/City/MarketStats';
import { Separator } from '@/components/ui/separator';
import { unslugifyCityName, getDateRanges } from './utils/helpers';
import { PageHeader } from './components/PageHeader';
import { HousingPricesSection } from './components/HousingPricesSection';
import { HousingInventorySection } from './components/HousingInventorySection';
import { RankingSection } from './components/RankingSection';
import { AboutReportSection } from './components/AboutReportSection';
import { CTABar } from './components/CTABar';

const CityTrendsPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.cityName as string || '';
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string } | null>(null);

  // Convert slug to city name
  const cityName = useMemo(() => {
    return unslugifyCityName(citySlug);
  }, [citySlug]);

  useEffect(() => {
    const loadCityData = async () => {
      try {
        setLoading(true);

        // Fetch properties for the city
        const listingsData = await getListings({
          status: 'A',
          resultsPerPage: 50,
          pageNum: 1,
        });

        // Filter properties by city name
        const cityProperties = listingsData.listings.filter(property =>
          property.address?.city?.toLowerCase() === cityName.toLowerCase()
        );

        setCityInfo({
          name: cityName,
        });

        setProperties(cityProperties);
      } catch (error) {
        console.error('Error loading city data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug) {
      loadCityData();
    }
  }, [citySlug, cityName]);

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

  const displayCityName = cityInfo?.name || cityName;
  const dateRanges = getDateRanges();

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <PageHeader cityName={displayCityName} citySlug={citySlug} />

      {/* Housing Prices Section */}
      <HousingPricesSection 
        cityName={displayCityName}
        properties={properties}
        dateRanges={dateRanges}
      />
      <Separator />

      {/* Housing Inventory Section */}
      <HousingInventorySection 
        cityName={displayCityName}
        dateRanges={dateRanges}
      />
      <Separator />

      {/* Ranking Section */}
      <RankingSection cityName={displayCityName} />
      <Separator />

      {/* CTA Bar */}
      <CTABar />

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        {/* Market Stats - Market Value Change */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Market Value Change in {displayCityName}
          </h2>
          <MarketStats cityName={displayCityName} properties={properties} />
        </section>
        <Separator />

        {/* About this Report Section */}
        <AboutReportSection 
          cityName={displayCityName}
          dateRange={dateRanges.current}
        />
      </main>
    </div>
  );
};

export default CityTrendsPage;
