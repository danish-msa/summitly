"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getListings } from '@/lib/api/properties';
import { PropertyListing } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Helper function to convert slug back to city name
const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CityNeighbourhoodsPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.cityName as string || '';
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string } | null>(null);
  const [neighbourhoods, setNeighbourhoods] = useState<Array<{
    name: string;
    count: number;
    avgPrice: number;
  }>>([]);

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

        // Calculate neighbourhood statistics
        const neighbourhoodMap = new Map<string, { count: number; totalPrice: number }>();
        
        cityProperties.forEach(property => {
          const neighbourhood = property.address?.neighborhood || property.address?.area || 'Unknown';
          const existing = neighbourhoodMap.get(neighbourhood) || { count: 0, totalPrice: 0 };
          neighbourhoodMap.set(neighbourhood, {
            count: existing.count + 1,
            totalPrice: existing.totalPrice + (property.listPrice || 0)
          });
        });

        const neighbourhoodsData = Array.from(neighbourhoodMap.entries())
          .map(([name, data]) => ({
            name,
            count: data.count,
            avgPrice: Math.round(data.totalPrice / data.count)
          }))
          .sort((a, b) => b.count - a.count);

        setNeighbourhoods(neighbourhoodsData);
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
          <p className="text-gray-600">Loading neighbourhoods...</p>
        </div>
      </div>
    );
  }

  const displayCityName = cityInfo?.name || cityName;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <header className="border-b bg-card pt-16">
        <div className="container-1400 mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {displayCityName} Neighbourhoods
              </h1>
              <p className="text-muted-foreground">
                Explore different neighbourhoods and areas in {displayCityName} and discover available properties.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        {/* Neighbourhoods Grid */}
        <section>
          {neighbourhoods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {neighbourhoods.map((neighbourhood) => (
                <Card key={neighbourhood.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {neighbourhood.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Properties</span>
                        <span className="font-semibold">{neighbourhood.count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Avg. Price</span>
                        <span className="font-semibold text-primary">
                          {formatPrice(neighbourhood.avgPrice)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-lg p-12 text-center">
              <p className="text-lg text-muted-foreground">
                No neighbourhood data available for {displayCityName}
              </p>
            </div>
          )}
        </section>
        <Separator />
      </main>
    </div>
  );
};

export default CityNeighbourhoodsPage;

