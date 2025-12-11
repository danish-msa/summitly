"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import Pagination from '@/components/ui/pagination';
import { formatPrice, getGreaterArea, cityNameToSlug } from '../utils/helpers';
import { 
  generateRankingOverviewData,
  generateRankingTableData
} from '../utils/dataGenerators';

const ITEMS_PER_PAGE = 25;

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface RankingSectionProps {
  locationType: LocationType;
  locationName: string;
}

// Type definitions for ranking data
type PriceRankingRow = {
  rank: number;
  city: string;
  averagePrice: number;
  medianPrice: number;
  isCurrentCity: boolean;
};

type GrowthRankingRow = {
  rank: number;
  city: string;
  priceGrowth: number;
  isCurrentCity: boolean;
};

type DaysOnMarketRankingRow = {
  rank: number;
  city: string;
  daysOnMarket: number;
  isCurrentCity: boolean;
};

type TurnoverRankingRow = {
  rank: number;
  city: string;
  turnover: number;
  isCurrentCity: boolean;
};

export const RankingSection: React.FC<RankingSectionProps> = ({ locationType, locationName }) => {
  // All hooks must be called before any early returns
  const greaterArea = getGreaterArea(locationName);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rankingOverview, setRankingOverview] = useState({
    mostExpensive: 0,
    fastestGrowing: 0,
    fastestSelling: 0,
    highestTurnover: 0,
  });
  const [rankingTableData, setRankingTableData] = useState(generateRankingTableData(locationName));
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort data based on search term and sort settings
  const getFilteredAndSortedData = React.useCallback(<T extends { city: string }>(
    data: T[]
  ): T[] => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortBy as keyof T];
        const bVal = b[sortBy as keyof T];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, sortBy, sortOrder]);

  // Filtered and sorted data for each table
  const filteredPriceData = useMemo(() => 
    getFilteredAndSortedData(rankingTableData.price),
    [rankingTableData.price, getFilteredAndSortedData]
  );
  
  const filteredGrowthData = useMemo(() => 
    getFilteredAndSortedData(rankingTableData.growth),
    [rankingTableData.growth, getFilteredAndSortedData]
  );
  
  const filteredDaysOnMarketData = useMemo(() => 
    getFilteredAndSortedData(rankingTableData.daysOnMarket),
    [rankingTableData.daysOnMarket, getFilteredAndSortedData]
  );
  
  const filteredTurnoverData = useMemo(() => 
    getFilteredAndSortedData(rankingTableData.turnover),
    [rankingTableData.turnover, getFilteredAndSortedData]
  );

  // Fetch live ranking data from optimized API route (with ISR caching and database storage)
  const fetchRankingData = React.useCallback(async (forceRefresh = false) => {
    // Only fetch for cities
    if (locationType !== 'city') return;
    
    // Clean location name and ensure it's in the cities list
    const cleanLocationName = locationName
      .replace(/\s+Real\s+Estate$/i, '')
      .replace(/\s+RE$/i, '')
      .trim();
    
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Build query params
      const params = new URLSearchParams();
      if (forceRefresh) params.append('refresh', 'true');
      const queryString = params.toString();
      
      // Add timeout to prevent infinite loading (60 seconds for rankings due to high API call count)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        // Fetch rankings from optimized API route (cached for 30 days, stored in MarketRankings table)
        // Rankings are stored once per month in MarketRankings table (shared by all cities)
        // Rankings are fetched separately due to high API call count (60+ calls)
        // Only fetch for cities
        const response = await fetch(
          `/api/market-trends/${locationType}/${encodeURIComponent(cleanLocationName)}/rankings${queryString ? `?${queryString}` : ''}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        const rankingsResult = await response.json();
        
        // Check if response has error (even if status is 200, the response might have error field)
        if (!response.ok || rankingsResult.error) {
          console.warn(`[RankingSection] ${cleanLocationName} - API returned error: ${rankingsResult.error || `Status ${response.status}`}, using mock data`);
          setRankingOverview(generateRankingOverviewData(cleanLocationName));
          setRankingTableData(generateRankingTableData(locationName));
          return; // Exit early, loading will be set to false in finally block
        }
      
      if (rankingsResult.rankings && rankingsResult.overview) {
        console.log(`[RankingSection] ${cleanLocationName} - Ranking Overview (cached: ${rankingsResult.cached}):`, rankingsResult.overview);
        console.log(`[RankingSection] ${cleanLocationName} - Sample ranking data:`, {
          priceRank: rankingsResult.rankings.price.find((r: { isCurrentCity: boolean }) => r.isCurrentCity)?.rank,
          growthRank: rankingsResult.rankings.growth.find((r: { isCurrentCity: boolean }) => r.isCurrentCity)?.rank,
        });
        setRankingOverview(rankingsResult.overview);
        setRankingTableData(rankingsResult.rankings);
      } else {
        console.warn(`[RankingSection] ${cleanLocationName} - No ranking data returned, using mock data`);
        // Fallback to mock data with city-specific ranks
        setRankingOverview(generateRankingOverviewData(cleanLocationName));
        setRankingTableData(generateRankingTableData(locationName));
      }
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        const error = fetchError as { name?: string };
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - rankings fetch took too long');
        }
        throw fetchError;
      }
    } catch (error) {
      const cleanLocationName = locationName
        .replace(/\s+Real\s+Estate$/i, '')
        .replace(/\s+RE$/i, '')
        .trim();
      console.error(`[RankingSection] ${cleanLocationName} - Error fetching ranking data:`, error);
      // Fallback to mock data on error with city-specific ranks
      setRankingOverview(generateRankingOverviewData(cleanLocationName));
      setRankingTableData(generateRankingTableData(locationName));
    } finally {
      if (forceRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [locationType, locationName]);

  useEffect(() => {
    if (locationName && locationType === 'city') {
      fetchRankingData(false);
    }
  }, [locationType, locationName, fetchRankingData]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Rankings are only available for cities - check after all hooks
  if (locationType !== 'city') {
    return null;
  }

  // Handle manual refresh
  const handleRefresh = () => {
    if (locationType === 'city') {
      fetchRankingData(true);
    }
  };

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Get paginated data
  const getPaginatedData = <T,>(data: T[]): T[] => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  // Column definitions for Price table
  const priceColumns: Column<PriceRankingRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'font-medium',
      sortable: true,
    },
    {
      key: 'city',
      header: 'City',
      className: 'font-medium',
      sortable: true,
      render: (row) => (
        <div className={row.isCurrentCity ? 'text-primary' : ''}>
          <Link 
            href={`/${cityNameToSlug(row.city)}/trends`}
            className="hover:underline text-inherit"
          >
            {row.city}
          </Link>
          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
        </div>
      ),
    },
    {
      key: 'averagePrice',
      header: 'Average Price',
      className: 'text-right',
      sortable: true,
      render: (row) => formatPrice(row.averagePrice),
    },
    {
      key: 'medianPrice',
      header: 'Median Price',
      className: 'text-right',
      sortable: true,
      render: (row) => formatPrice(row.medianPrice),
    },
  ];

  // Column definitions for Growth table
  const growthColumns: Column<GrowthRankingRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'font-medium',
      sortable: true,
    },
    {
      key: 'city',
      header: 'City',
      className: 'font-medium',
      sortable: true,
      render: (row) => (
        <div className={row.isCurrentCity ? 'text-primary' : ''}>
          <Link 
            href={`/${cityNameToSlug(row.city)}/trends`}
            className="hover:underline text-inherit"
          >
            {row.city}
          </Link>
          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
        </div>
      ),
    },
    {
      key: 'priceGrowth',
      header: 'Price Growth',
      className: 'text-right',
      sortable: true,
      render: (row) => (
        <span className={row.priceGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
          {row.priceGrowth >= 0 ? '+' : ''}{row.priceGrowth}%
        </span>
      ),
    },
  ];

  // Column definitions for Days on Market table
  const daysOnMarketColumns: Column<DaysOnMarketRankingRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'font-medium',
      sortable: true,
    },
    {
      key: 'city',
      header: 'City',
      className: 'font-medium',
      sortable: true,
      render: (row) => (
        <div className={row.isCurrentCity ? 'text-primary' : ''}>
          <Link 
            href={`/${cityNameToSlug(row.city)}/trends`}
            className="hover:underline text-inherit"
          >
            {row.city}
          </Link>
          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
        </div>
      ),
    },
    {
      key: 'daysOnMarket',
      header: 'Days on Market',
      className: 'text-right',
      sortable: true,
    },
  ];

  // Column definitions for Turnover table
  const turnoverColumns: Column<TurnoverRankingRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'font-medium',
      sortable: true,
    },
    {
      key: 'city',
      header: 'City',
      className: 'font-medium',
      sortable: true,
      render: (row) => (
        <div className={row.isCurrentCity ? 'text-primary' : ''}>
          <Link 
            href={`/${cityNameToSlug(row.city)}/trends`}
            className="hover:underline text-inherit"
          >
            {row.city}
          </Link>
          {row.isCurrentCity && <span className="ml-2 text-xs text-primary">(Current)</span>}
        </div>
      ),
    },
    {
      key: 'turnover',
      header: 'Turnover',
      className: 'text-right',
      sortable: true,
      render: (row) => `${row.turnover}%`,
    },
  ];

  if (loading) {
    return (
      <section className="border-b">
        <div className="container-1400 mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {locationName}'s Ranking in {greaterArea}
          </h2>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading ranking data...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            {locationName}'s Ranking in {greaterArea}
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data from API"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Overview Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Ranking Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.mostExpensive || 'N/A'}
                  {rankingOverview.mostExpensive > 0 && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {rankingOverview.mostExpensive === 1 ? 'st' : 
                       rankingOverview.mostExpensive === 2 ? 'nd' : 
                       rankingOverview.mostExpensive === 3 ? 'rd' : 'th'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Most expensive</p>
              </div>
            </Card>
            
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.fastestGrowing || 'N/A'}
                  {rankingOverview.fastestGrowing > 0 && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {rankingOverview.fastestGrowing === 1 ? 'st' : 
                       rankingOverview.fastestGrowing === 2 ? 'nd' : 
                       rankingOverview.fastestGrowing === 3 ? 'rd' : 'th'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Fastest Growing</p>
              </div>
            </Card>
            
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.fastestSelling || 'N/A'}
                  {rankingOverview.fastestSelling > 0 && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {rankingOverview.fastestSelling === 1 ? 'st' : 
                       rankingOverview.fastestSelling === 2 ? 'nd' : 
                       rankingOverview.fastestSelling === 3 ? 'rd' : 'th'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Fastest Selling</p>
              </div>
            </Card>
            
            <Card className="p-6" variant="white">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {rankingOverview.highestTurnover || 'N/A'}
                  {rankingOverview.highestTurnover > 0 && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {rankingOverview.highestTurnover === 1 ? 'st' : 
                       rankingOverview.highestTurnover === 2 ? 'nd' : 
                       rankingOverview.highestTurnover === 3 ? 'rd' : 'th'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Highest Turnover</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Ranking Tables */}
        <div className="mb-8">
          <Tabs 
            defaultValue="price" 
            className="w-full"
            onValueChange={() => {
              setCurrentPage(1); // Reset to first page when switching tabs
              setSearchTerm(''); // Reset search when switching tabs
              setSortBy(''); // Reset sort when switching tabs
            }}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="price" className="px-4">
                Price
              </TabsTrigger>
              <TabsTrigger value="growth" className="px-4">
                Growth
              </TabsTrigger>
              <TabsTrigger value="daysOnMarket" className="px-4">
                Days on Market
              </TabsTrigger>
              <TabsTrigger value="turnover" className="px-4">
                Turnover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="mt-0">
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  If the average price is skewed, the median is a more accurate reflection of the market.
                </p>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              <DataTable
                data={getPaginatedData(filteredPriceData)}
                columns={priceColumns}
                keyExtractor={(row) => `${row.rank}-${row.city}`}
                emptyMessage="No cities found"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                getRowClassName={(row) => row.isCurrentCity ? "bg-primary/5 font-semibold" : ""}
              />

              {/* Pagination */}
              {filteredPriceData.length > ITEMS_PER_PAGE && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredPriceData.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="growth" className="mt-0">
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Price growth is the change in sale price from the same period last year.
                </p>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              <DataTable
                data={getPaginatedData(filteredGrowthData)}
                columns={growthColumns}
                keyExtractor={(row) => `${row.rank}-${row.city}`}
                emptyMessage="No cities found"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                getRowClassName={(row) => row.isCurrentCity ? "bg-primary/5 font-semibold" : ""}
              />

              {/* Pagination */}
              {filteredGrowthData.length > ITEMS_PER_PAGE && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredGrowthData.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="daysOnMarket" className="mt-0">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              <DataTable
                data={getPaginatedData(filteredDaysOnMarketData)}
                columns={daysOnMarketColumns}
                keyExtractor={(row) => `${row.rank}-${row.city}`}
                emptyMessage="No cities found"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                getRowClassName={(row) => row.isCurrentCity ? "bg-primary/5 font-semibold" : ""}
              />

              {/* Pagination */}
              {filteredDaysOnMarketData.length > ITEMS_PER_PAGE && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredDaysOnMarketData.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="turnover" className="mt-0">
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Turnover is the percentage of homes sold over listings added in the last 28 days.
                </p>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              <DataTable
                data={getPaginatedData(filteredTurnoverData)}
                columns={turnoverColumns}
                keyExtractor={(row) => `${row.rank}-${row.city}`}
                emptyMessage="No cities found"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                getRowClassName={(row) => row.isCurrentCity ? "bg-primary/5 font-semibold" : ""}
              />

              {/* Pagination */}
              {filteredTurnoverData.length > ITEMS_PER_PAGE && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredTurnoverData.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
