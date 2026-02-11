"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import Pagination from '@/components/ui/pagination';
import { formatFullPrice } from '../utils/helpers';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

interface CityBreakdownSectionProps {
  locationType: LocationType;
  locationName: string;
}

// GTA (Greater Toronto Area) cities list - Core municipalities
const GTA_CITIES = [
  // Toronto
  'Toronto',
  // Peel Region
  'Mississauga', 'Brampton', 'Caledon',
  // York Region
  'Markham', 'Vaughan', 'Richmond Hill', 'Aurora', 'Newmarket', 'Georgina', 
  'East Gwillimbury', 'Whitchurch-Stouffville', 'King',
  // Halton Region
  'Oakville', 'Burlington', 'Milton', 'Halton Hills',
  // Durham Region
  'Ajax', 'Pickering', 'Whitby', 'Oshawa', 'Clarington', 'Uxbridge', 'Scugog', 'Brock'
];

interface CityBreakdownData {
  city: string;
  averagePrice: number;
  medianPrice: number;
  averageOneYearChange: number;
  medianOneYearChange: number;
  totalTransactions: number;
}

export const CityBreakdownSection: React.FC<CityBreakdownSectionProps> = ({ 
  locationType,
  locationName 
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averagePriceData, setAveragePriceData] = useState<(CityBreakdownData & { oneYearChange: number })[]>([]);
  const [medianPriceData, setMedianPriceData] = useState<(CityBreakdownData & { oneYearChange: number })[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentPageAvg, setCurrentPageAvg] = useState(1);
  const [currentPageMed, setCurrentPageMed] = useState(1);
  
  // Sorting state for average prices table
  const [sortByAvg, setSortByAvg] = useState<string>('averagePrice');
  const [sortOrderAvg, setSortOrderAvg] = useState<'asc' | 'desc'>('desc');
  
  // Sorting state for median prices table
  const [sortByMed, setSortByMed] = useState<string>('medianPrice');
  const [sortOrderMed, setSortOrderMed] = useState<'asc' | 'desc'>('desc');
  
  const ITEMS_PER_PAGE = 25;

  const fetchCityBreakdown = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch from API route (which handles caching)
      const url = forceRefresh 
        ? '/api/market-trends/city-breakdown?refresh=true'
        : '/api/market-trends/city-breakdown';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch city breakdown data');
      }

      const data = await response.json();
      
      // Format month for display
      const [year, month] = data.month.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = parseInt(month) - 1;
      setCurrentMonth(`${monthNames[monthIndex]} ${year}`);

      const breakdownData = data.breakdownData as CityBreakdownData[];

      // Filter to only GTA cities
      // Normalize city names for matching (remove spaces, special chars, convert to lowercase)
      const normalizeCityName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Create a Set of normalized GTA city names for faster lookup
      const normalizedGtaCitiesSet = new Set(GTA_CITIES.map(city => normalizeCityName(city)));
      
      const gtaBreakdownData = breakdownData.filter(item => {
        const normalizedItemCity = normalizeCityName(item.city);
        // Only match if the normalized city name exactly matches a GTA city
        return normalizedGtaCitiesSet.has(normalizedItemCity);
      });

      // Create separate arrays for average and median tables
      // For average table, use averageOneYearChange
      const avgData = gtaBreakdownData.map(data => ({
        ...data,
        oneYearChange: data.averageOneYearChange,
      }));

      // For median table, use medianOneYearChange
      const medData = gtaBreakdownData.map(data => ({
        ...data,
        oneYearChange: data.medianOneYearChange,
      }));

      setAveragePriceData(avgData);
      setMedianPriceData(medData);
      
      // Reset to first page when data changes
      setCurrentPageAvg(1);
      setCurrentPageMed(1);
      
      // Reset sorting to defaults
      setSortByAvg('averagePrice');
      setSortOrderAvg('desc');
      setSortByMed('medianPrice');
      setSortOrderMed('desc');
    } catch (error) {
      console.error('[CityBreakdownSection] Error fetching city breakdown:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch for city-level views
    if (locationType === 'city') {
      fetchCityBreakdown();
    }
  }, [locationType, locationName]);

  // Sort and paginate data for average prices table - must be called before any conditional returns
  const paginatedAvgData = useMemo(() => {
    // Create a copy to avoid mutating the original
    const sortedData = [...averagePriceData].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortByAvg) {
        case 'city':
          aValue = a.city.toLowerCase();
          bValue = b.city.toLowerCase();
          break;
        case 'averagePrice':
          aValue = a.averagePrice;
          bValue = b.averagePrice;
          break;
        case 'oneYearChange':
          aValue = a.oneYearChange;
          bValue = b.oneYearChange;
          break;
        case 'totalTransactions':
          aValue = a.totalTransactions;
          bValue = b.totalTransactions;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrderAvg === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrderAvg === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
    
    const startIndex = (currentPageAvg - 1) * ITEMS_PER_PAGE;
    const paginated = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    // Add ranking to each item based on its position in the sorted dataset
    return paginated.map((item, index) => ({
      ...item,
      rank: startIndex + index + 1,
    }));
  }, [averagePriceData, currentPageAvg, sortByAvg, sortOrderAvg]);

  // Sort and paginate data for median prices table - must be called before any conditional returns
  const paginatedMedData = useMemo(() => {
    // Create a copy to avoid mutating the original
    const sortedData = [...medianPriceData].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortByMed) {
        case 'city':
          aValue = a.city.toLowerCase();
          bValue = b.city.toLowerCase();
          break;
        case 'medianPrice':
          aValue = a.medianPrice;
          bValue = b.medianPrice;
          break;
        case 'oneYearChange':
          aValue = a.oneYearChange;
          bValue = b.oneYearChange;
          break;
        case 'totalTransactions':
          aValue = a.totalTransactions;
          bValue = b.totalTransactions;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrderMed === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrderMed === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
    
    const startIndex = (currentPageMed - 1) * ITEMS_PER_PAGE;
    const paginated = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    // Add ranking to each item based on its position in the sorted dataset
    return paginated.map((item, index) => ({
      ...item,
      rank: startIndex + index + 1,
    }));
  }, [medianPriceData, currentPageMed, sortByMed, sortOrderMed]);
  
  // Handle sorting for average prices table
  const handleSortAvg = (key: string) => {
    if (sortByAvg === key) {
      // Toggle sort order if clicking the same column
      setSortOrderAvg(sortOrderAvg === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending for numbers, ascending for strings
      setSortByAvg(key);
      setSortOrderAvg(key === 'city' ? 'asc' : 'desc');
    }
    setCurrentPageAvg(1); // Reset to first page when sorting changes
  };
  
  // Handle sorting for median prices table
  const handleSortMed = (key: string) => {
    if (sortByMed === key) {
      // Toggle sort order if clicking the same column
      setSortOrderMed(sortOrderMed === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending for numbers, ascending for strings
      setSortByMed(key);
      setSortOrderMed(key === 'city' ? 'asc' : 'desc');
    }
    setCurrentPageMed(1); // Reset to first page when sorting changes
  };

  const handleRefresh = () => {
    fetchCityBreakdown(true);
  };

  // Only show for city-level views
  if (locationType !== 'city') {
    return null;
  }

  if (loading) {
    return (
      <section className="border-b">
        <div className="container-1400 mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  // Average Prices by City table columns
  const averagePriceColumns: Column<CityBreakdownData & { oneYearChange: number; rank?: number }>[] = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'text-center font-medium w-12 px-1 py-1 text-xs',
      render: (row) => row.rank || '-',
    },
    {
      key: 'city',
      header: 'City',
      className: 'font-medium px-2 py-1 text-xs',
      sortable: true,
    },
    {
      key: 'averagePrice',
      header: 'Average Sold Price',
      className: 'text-right px-2 py-1 text-xs',
      sortable: true,
      render: (row) => formatFullPrice(row.averagePrice),
    },
    {
      key: 'oneYearChange',
      header: '1-Year Change',
      className: 'text-right px-2 py-1 text-xs',
      sortable: true,
      render: (row) => {
        const change = row.oneYearChange;
        const isPositive = change > 0;
        const isNegative = change < 0;
        return (
          <span className={isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'totalTransactions',
      header: 'Total Transactions',
      className: 'text-right px-2 py-1 text-xs',
      sortable: true,
      render: (row) => row.totalTransactions.toLocaleString(),
    },
  ];

  // Median Prices by City table columns
  const medianPriceColumns: Column<CityBreakdownData & { oneYearChange: number; rank?: number }>[] = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'text-center font-medium w-12 px-1 py-1 text-xs',
      render: (row) => row.rank || '-',
    },
    {
      key: 'city',
      header: 'City',
      className: 'font-medium px-2 py-1 text-xs',
      sortable: true,
    },
    {
      key: 'medianPrice',
      header: 'Median Sold Price',
      className: 'text-right px-2 py-1 text-xs',
      sortable: true,
      render: (row) => formatFullPrice(row.medianPrice),
    },
    {
      key: 'oneYearChange',
      header: '1-Year Change',
      className: 'text-right px-2 py-1 text-xs',
      sortable: true,
      render: (row) => {
        const change = row.oneYearChange;
        const isPositive = change > 0;
        const isNegative = change < 0;
        return (
          <span className={isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'totalTransactions',
      header: 'Total Transactions',
      className: 'text-right px-2 py-1 text-xs',
      sortable: true,
      render: (row) => row.totalTransactions.toLocaleString(),
    },
  ];

  const totalPagesAvg = Math.ceil(averagePriceData.length / ITEMS_PER_PAGE);
  const totalPagesMed = Math.ceil(medianPriceData.length / ITEMS_PER_PAGE);

  return (
    <section className="border-b">
      <div className="container-1400 mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-foreground">
            Breakdown by City
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data from API"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-muted-foreground mb-8">
          Data for {currentMonth}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Prices by City Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              Average Prices by City
            </h3>
            <div className="overflow-auto">
              <div className="[&_th]:h-8 [&_th]:py-2 [&_td]:py-1.5">
                <DataTable
                  data={paginatedAvgData}
                  columns={averagePriceColumns}
                  keyExtractor={(row) => row.city}
                  className="p-2"
                  sortBy={sortByAvg}
                  sortOrder={sortOrderAvg}
                  onSort={handleSortAvg}
                />
              </div>
            </div>
            {totalPagesAvg > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPageAvg}
                  totalPages={totalPagesAvg}
                  onPageChange={setCurrentPageAvg}
                />
              </div>
            )}
          </div>

          {/* Median Prices by City Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              Median Prices by City
            </h3>
            <div className="overflow-auto">
              <div className="[&_th]:h-8 [&_th]:py-2 [&_td]:py-1.5">
                <DataTable
                  data={paginatedMedData}
                  columns={medianPriceColumns}
                  keyExtractor={(row) => row.city}
                  className="p-2"
                  sortBy={sortByMed}
                  sortOrder={sortOrderMed}
                  onSort={handleSortMed}
                />
              </div>
            </div>
            {totalPagesMed > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPageMed}
                  totalPages={totalPagesMed}
                  onPageChange={setCurrentPageMed}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

