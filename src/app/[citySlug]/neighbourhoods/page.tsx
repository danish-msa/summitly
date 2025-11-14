"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flame, Snowflake, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateMockNeighbourhoodData } from '@/components/Location/neighbourhoods/utils/dataGenerators';
import { getListings } from '@/lib/api/properties';
import { parseCityUrl } from '@/lib/utils/cityUrl';

// Helper function to slugify neighbourhood name
const slugifyNeighbourhoodName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const CityNeighbourhoodsPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string || '';
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string } | null>(null);
  const [neighbourhoodData, setNeighbourhoodData] = useState<{
    hottest: Array<{
      rank: number;
      name: string;
      soldUnder10d: number;
      soldAboveAsking: number;
      averageSalePrice: number;
      activeListings: number;
    }>;
    coldest: Array<{
      rank: number;
      name: string;
      soldUnder10d: number;
      soldAboveAsking: number;
      averageSalePrice: number;
      activeListings: number;
    }>;
    all: Array<{
      rank: number;
      name: string;
      soldUnder10d: number;
      soldAboveAsking: number;
      averageSalePrice: number;
      activeListings: number;
    }>;
    totalCount: number;
  } | null>(null);

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

        // Fetch properties to get real neighbourhood data
        const listingsData = await getListings({
          status: 'A',
          resultsPerPage: 1000,
          pageNum: 1,
        });

        // Filter properties by city
        const cityProperties = listingsData.listings.filter(property =>
          property.address?.city?.toLowerCase() === cityName.toLowerCase()
        );

        // Group by neighbourhood and area
        const neighbourhoodMap = new Map<string, { 
          area: string; 
          count: number; 
          totalPrice: number 
        }>();
        
        cityProperties.forEach(property => {
          const neighbourhoodName = property.address?.neighborhood;
          const areaName = property.address?.area;
          if (neighbourhoodName && areaName) {
            const existing = neighbourhoodMap.get(neighbourhoodName) || { 
              area: areaName, 
              count: 0, 
              totalPrice: 0 
            };
            neighbourhoodMap.set(neighbourhoodName, {
              area: areaName,
              count: existing.count + 1,
              totalPrice: existing.totalPrice + (property.listPrice || 0)
            });
          }
        });

        // Convert to array format
        const neighbourhoodsList = Array.from(neighbourhoodMap.entries()).map(([name, data], index) => ({
          rank: index + 1,
          name,
          area: data.area,
          soldUnder10d: Math.floor(Math.random() * 30) + 10, // Mock data
          soldAboveAsking: Math.floor(Math.random() * 40) + 5, // Mock data
          averageSalePrice: data.count > 0 ? Math.round(data.totalPrice / data.count) : 0,
          activeListings: data.count
        })).sort((a, b) => b.activeListings - a.activeListings);

        // Use mock data structure but with real neighbourhood names
        const mockData = generateMockNeighbourhoodData();
        const allNeighbourhoods = neighbourhoodsList.length > 0 
          ? neighbourhoodsList 
          : mockData.all.map((n) => ({ ...n, area: 'downtown' }));

        setNeighbourhoodData({
          hottest: allNeighbourhoods.slice(0, 5),
          coldest: allNeighbourhoods.slice(-5).reverse(),
          all: allNeighbourhoods,
          totalCount: allNeighbourhoods.length
        });
      } catch (error) {
        console.error('Error loading city data:', error);
        // Fallback to mock data on error
        const mockData = generateMockNeighbourhoodData();
        setNeighbourhoodData(mockData);
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
          <p className="text-gray-600">Loading neighbourhoods...</p>
        </div>
      </div>
    );
  }

  const displayCityName = cityInfo?.name || cityName;
  const totalCount = neighbourhoodData?.totalCount || 0;

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

  const NeighbourhoodTable = ({ 
    title, 
    data,
    icon: Icon,
    iconColor
  }: { 
    title: string; 
    data: Array<{
      rank: number;
      name: string;
      area?: string;
      soldUnder10d: number;
      soldAboveAsking: number;
      averageSalePrice: number;
      activeListings: number;
      totalCount?: number;
    }>;
    icon?: React.ComponentType<{ className?: string }>;
    iconColor?: string;
  }) => {
    const totalCount = data[0]?.totalCount || 0;
    
    // Helper to slugify area name
    const slugifyAreaName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        {Icon && (
          <Icon className={`h-6 w-6 ${iconColor || 'text-primary'}`} />
        )}
        {title}
      </h3>
      <div className="overflow-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="font-semibold">Neighbourhood (# Rank out of {totalCount > 0 ? totalCount : 'N/A'})</TableHead>
              <TableHead className="text-right font-semibold">Sold under 10d</TableHead>
              <TableHead className="text-right font-semibold">Sold above asking</TableHead>
              <TableHead className="text-right font-semibold">Average sale price</TableHead>
              <TableHead className="text-right font-semibold">Active listings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {data.length > 0 ? (
              data.map((neighbourhood) => {
                const areaSlug = neighbourhood.area ? slugifyAreaName(neighbourhood.area) : 'downtown';
                const neighbourhoodUrl = `/${cityUrlSlug}/${areaSlug}/${slugifyNeighbourhoodName(neighbourhood.name)}`;
                
                return (
                  <TableRow 
                    key={neighbourhood.name} 
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={neighbourhoodUrl}
                        className="hover:text-primary transition-colors"
                      >
                        {neighbourhood.rank} {neighbourhood.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{neighbourhood.soldUnder10d}%</TableCell>
                    <TableCell className="text-right">{neighbourhood.soldAboveAsking}%</TableCell>
                    <TableCell className="text-right">{formatPrice(neighbourhood.averageSalePrice)}</TableCell>
                    <TableCell className="text-right">{neighbourhood.activeListings}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    );
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
                The Hottest {displayCityName} Neighbourhoods
              </h1>
              <p className="text-muted-foreground mt-4">
                Get an idea of the fastest selling neighbourhoods in {displayCityName}. See areas with the most demand, as measured by competitive bids over asking price. And, evaluate the average selling price of each neighbourhood.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        {neighbourhoodData ? (
          <>
            <NeighbourhoodTable 
              title={`Hottest ${displayCityName} Neighbourhoods`}
              data={neighbourhoodData.hottest.slice(0, 5).map(n => ({ ...n, totalCount }))}
              icon={Flame}
              iconColor="text-orange-500"
            />
            
            <NeighbourhoodTable 
              title={`Coldest ${displayCityName} Neighbourhoods`}
              data={neighbourhoodData.coldest.slice(0, 5).map(n => ({ ...n, totalCount }))}
              icon={Snowflake}
              iconColor="text-blue-400"
            />
            
            <NeighbourhoodTable 
              title={`All ${displayCityName} Neighbourhoods`}
              data={neighbourhoodData.all.map(n => ({ ...n, totalCount }))}
              icon={MapPin}
              iconColor="text-primary"
            />
          </>
        ) : (
          <div className="bg-secondary/30 rounded-lg p-12 text-center">
            <p className="text-lg text-muted-foreground">
              No neighbourhood data available for {displayCityName}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CityNeighbourhoodsPage;

