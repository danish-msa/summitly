import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService, type MarketData, type ListingsActivity, type SoldPriceData } from '@/lib/api/repliers';

// Re-export types from the API
export type { MarketData, ListingsActivity as ListingsData, SoldPriceData };

export interface UseMarketAnalyticsProps {
  latitude?: number | null;
  longitude?: number | null;
  propertyClass?: string;
  enabled?: boolean;
  radiusKm?: number;
}

export const useMarketAnalytics = ({ 
  latitude, 
  longitude, 
  propertyClass = 'residential',
  enabled = true,
  radiusKm = 10
}: UseMarketAnalyticsProps) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [listingsData, setListingsData] = useState<ListingsActivity | null>(null);
  const [soldPriceData, setSoldPriceData] = useState<SoldPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    if (!enabled || !latitude || !longitude) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all analytics data in parallel
      const [marketTrends, listingsActivity, soldPriceTrends] = await Promise.all([
        AnalyticsService.getMarketTrends({
          latitude,
          longitude,
          radiusKm,
          propertyClass,
        }),
        AnalyticsService.getListingsActivity({
          latitude,
          longitude,
          radiusKm,
          propertyClass,
        }),
        AnalyticsService.getSoldPriceTrends({
          latitude,
          longitude,
          radiusKm,
          propertyClass,
        }),
      ]);

      // Set market data if available
      if (marketTrends) {
        setMarketData(marketTrends);
      }

      // Set listings data if available
      if (listingsActivity) {
        setListingsData(listingsActivity);
      }

      // Set sold price data if available
      if (soldPriceTrends) {
        setSoldPriceData(soldPriceTrends);
      }

      // Set error if all failed
      if (!marketTrends && !listingsActivity && !soldPriceTrends) {
        setError('Failed to fetch market data');
      }

    } catch (err) {
      console.error('Failed to fetch market data:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch market data';
      if (err instanceof Error) {
        if (err.message.includes('API key not configured')) {
          errorMessage = 'API key not configured - using sample data';
        } else if (err.message.includes('401')) {
          errorMessage = 'API authentication failed - using sample data';
        } else if (err.message.includes('403')) {
          errorMessage = 'API access forbidden - using sample data';
        } else if (err.message.includes('429')) {
          errorMessage = 'API rate limit exceeded - using sample data';
        } else {
          errorMessage = `API error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, enabled, radiusKm, propertyClass]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const refetch = useCallback(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    marketData,
    listingsData,
    soldPriceData,
    loading,
    error,
    refetch,
  };
};
