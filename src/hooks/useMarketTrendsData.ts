"use client";

import { useMarketTrends } from '@/contexts/MarketTrendsContext';
import { useMemo } from 'react';

/**
 * Custom hook to access market trends data with automatic caching
 * 
 * This hook provides access to market trends data that's shared across
 * all components on the same page, reducing redundant API calls.
 * 
 * @example
 * ```tsx
 * const { priceOverview, loading } = useMarketTrendsData();
 * ```
 */
export const useMarketTrendsData = () => {
  const { data, refresh, clearCache } = useMarketTrends();

  return useMemo(() => ({
    // Price data
    priceOverview: data.priceOverview,
    averageSoldPrice: data.averageSoldPrice,
    salesVolumeByType: data.salesVolumeByType,
    priceByBedrooms: data.priceByBedrooms,
    
    // Inventory data
    inventoryOverview: data.inventoryOverview,
    newClosedAvailable: data.newClosedAvailable,
    daysOnMarket: data.daysOnMarket,
    
    // Ranking data
    rankings: data.rankings,
    rankingOverview: data.rankingOverview,
    
    // Metadata
    loading: data.loading,
    error: data.error,
    lastUpdated: data.lastUpdated,
    
    // Actions
    refresh,
    clearCache,
  }), [data, refresh, clearCache]);
};

