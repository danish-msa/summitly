"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { RepliersAPI } from '@/lib/api/repliers';
import { getDateRanges } from '@/components/Location/trends/utils/helpers';
import type {
  PriceOverviewData,
  AverageSoldPriceData,
  SalesVolumeByTypeData,
  InventoryOverviewData,
  NewClosedAvailableData,
  DaysOnMarketData,
  RankingData,
  RankingOverviewData,
} from '@/lib/api/repliers/services/analytics';

interface MarketTrendsData {
  // Price data
  priceOverview: PriceOverviewData | null;
  averageSoldPrice: AverageSoldPriceData | null;
  salesVolumeByType: SalesVolumeByTypeData | null;
  priceByBedrooms: unknown | null;
  
  // Inventory data
  inventoryOverview: InventoryOverviewData | null;
  newClosedAvailable: NewClosedAvailableData | null;
  daysOnMarket: DaysOnMarketData | null;
  
  // Ranking data (stored in separate MarketRankings table - one record per month, shared by all cities)
  // Fetch via /api/market-trends/[locationType]/[locationName]/rankings
  rankings: RankingData | null;
  rankingOverview: RankingOverviewData | null;
  
  // Metadata
  loading: boolean;
  lastUpdated: number | null;
  error: string | null;
}

interface MarketTrendsContextType {
  data: MarketTrendsData;
  refresh: (cityName: string) => Promise<void>;
  clearCache: () => void;
}

const MarketTrendsContext = createContext<MarketTrendsContextType | undefined>(undefined);

export const useMarketTrends = () => {
  const context = useContext(MarketTrendsContext);
  if (!context) {
    throw new Error('useMarketTrends must be used within MarketTrendsProvider');
  }
  return context;
};

interface MarketTrendsProviderProps {
  children: React.ReactNode;
  cityName: string;
  autoFetch?: boolean;
}

export const MarketTrendsProvider: React.FC<MarketTrendsProviderProps> = ({ 
  children, 
  cityName,
  autoFetch = true 
}) => {
  const [data, setData] = useState<MarketTrendsData>({
    priceOverview: null,
    averageSoldPrice: null,
    salesVolumeByType: null,
    priceByBedrooms: null,
    inventoryOverview: null,
    newClosedAvailable: null,
    daysOnMarket: null,
    rankings: null,
    rankingOverview: null,
    loading: false,
    lastUpdated: null,
    error: null,
  });

  const dateRanges = useMemo(() => getDateRanges(), []);

  const fetchMarketTrends = useCallback(async (city: string, forceRefresh = false) => {
    // Check if we have recent data (within 5 minutes) and not forcing refresh
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    if (!forceRefresh && data.lastUpdated && data.lastUpdated > fiveMinutesAgo) {
      console.log('[MarketTrendsProvider] Using cached data');
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const cleanCityName = city
        .replace(/\s+Real\s+Estate$/i, '')
        .replace(/\s+RE$/i, '')
        .trim();

      const analyticsParams = { city: cleanCityName };

      // Fetch all data in parallel - this is more efficient than sequential calls
      const [
        priceOverview,
        averageSoldPrice,
        salesVolumeByType,
        inventoryOverview,
        newClosedAvailable,
        daysOnMarket,
      ] = await Promise.all([
        RepliersAPI.analytics.getPriceOverview(analyticsParams, dateRanges),
        RepliersAPI.analytics.getAverageSoldPriceData(analyticsParams),
        RepliersAPI.analytics.getSalesVolumeByType(analyticsParams),
        RepliersAPI.analytics.getInventoryOverview(analyticsParams, dateRanges),
        RepliersAPI.analytics.getNewClosedAvailableData(analyticsParams, dateRanges),
        RepliersAPI.analytics.getDaysOnMarketData(analyticsParams),
      ]);

      setData({
        priceOverview,
        averageSoldPrice,
        salesVolumeByType,
        priceByBedrooms: null, // Keep null for now
        inventoryOverview,
        newClosedAvailable,
        daysOnMarket,
        rankings: null, // Rankings are stored in separate MarketRankings table (one record per month, shared by all cities)
        rankingOverview: null, // Fetch via /api/market-trends/[locationType]/[locationName]/rankings
        loading: false,
        lastUpdated: now,
        error: null,
      });
    } catch (error) {
      console.error('[MarketTrendsProvider] Error fetching market trends:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market trends',
      }));
    }
  }, [data.lastUpdated, dateRanges]);

  const refresh = useCallback(async (city: string) => {
    await fetchMarketTrends(city, true);
  }, [fetchMarketTrends]);

  const clearCache = useCallback(() => {
    setData({
      priceOverview: null,
      averageSoldPrice: null,
      salesVolumeByType: null,
      priceByBedrooms: null,
      inventoryOverview: null,
      newClosedAvailable: null,
      daysOnMarket: null,
      rankings: null,
      rankingOverview: null,
      loading: false,
      lastUpdated: null,
      error: null,
    });
    RepliersAPI.client.clearCache();
  }, []);

  useEffect(() => {
    if (autoFetch && cityName) {
      fetchMarketTrends(cityName);
    }
  }, [cityName, autoFetch, fetchMarketTrends]);

  const value = useMemo(() => ({
    data,
    refresh,
    clearCache,
  }), [data, refresh, clearCache]);

  return (
    <MarketTrendsContext.Provider value={value}>
      {children}
    </MarketTrendsContext.Provider>
  );
};

