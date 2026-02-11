"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getListings } from '@/lib/api/properties';
import { parseCityUrl } from '@/lib/utils/cityUrl';

// Helper function to slugify area name
const slugifyAreaName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const CityAreasPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string || '';
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string } | null>(null);
  const [areas, setAreas] = useState<Array<{
    name: string;
    activeListings: number;
    averagePrice: number;
  }>>([]);

  // Parse city name from slug (remove -real-estate suffix)
  const cityName = useMemo(() => {
    if (!citySlug.endsWith('-real-estate')) {
      return '';
    }
    return parseCityUrl(citySlug);
  }, [citySlug]);
  
  // Get city URL slug (with -real-estate suffix)
  const cityUrlSlug = useMemo(() => {
    return citySlug; // Already has -real-estate suffix
  }, [citySlug]);

  useEffect(() => {
    const loadCityData = async () => {
      try {
        setLoading(true);

        setCityInfo({
          name: cityName,
        });

        // Fetch properties for the city
        const listingsData = await getListings({
          status: 'A',
          resultsPerPage: 1000, // Get more to have better area data
          pageNum: 1,
        });

        // Filter properties by city name
        const cityProperties = listingsData.listings.filter(property =>
          property.address?.city?.toLowerCase() === cityName.toLowerCase()
        );

        // Group properties by area
        const areaMap = new Map<string, { count: number; totalPrice: number }>();
        
        cityProperties.forEach(property => {
          const areaName = property.address?.area;
          if (areaName) {
            const existing = areaMap.get(areaName) || { count: 0, totalPrice: 0 };
            areaMap.set(areaName, {
              count: existing.count + 1,
              totalPrice: existing.totalPrice + (property.listPrice || 0)
            });
          }
        });

        // Convert to array and calculate averages
        const areasData = Array.from(areaMap.entries()).map(([name, data]) => ({
          name,
          activeListings: data.count,
          averagePrice: data.count > 0 ? Math.round(data.totalPrice / data.count) : 0
        })).sort((a, b) => b.activeListings - a.activeListings);

        setAreas(areasData);
      } catch (error) {
        console.error('Error loading city data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug && cityName) {
      loadCityData();
    }
  }, [citySlug, cityName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading areas...</p>
        </div>
      </div>
    );
  }

  const displayCityName = cityInfo?.name || cityName;

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
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
          {/* Back Button */}
          <div className="mb-4">
            <Link href={`/${cityUrlSlug}`}>
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to {displayCityName} Page</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Areas in {displayCityName}
              </h1>
              <p className="text-muted-foreground mt-4">
                Explore different areas in {displayCityName}. Click on an area to view properties and market trends.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        {areas.length > 0 ? (
          <div className="overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-semibold">Area Name</TableHead>
                  <TableHead className="text-right font-semibold">Active Listings</TableHead>
                  <TableHead className="text-right font-semibold">Average Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {areas.map((area) => (
                  <TableRow 
                    key={area.name} 
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      <Link 
                        href={`/${cityUrlSlug}/${slugifyAreaName(area.name)}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <MapPin className="h-4 w-4" />
                        {area.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{area.activeListings}</TableCell>
                    <TableCell className="text-right">{formatPrice(area.averagePrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-secondary/30 rounded-lg p-12 text-center">
            <p className="text-lg text-muted-foreground">
              No area data available for {displayCityName}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CityAreasPage;

