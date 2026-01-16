"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';

export interface MarketTrendsData {
  priceOverview: {
    current: {
      avgPrice: number;
      salesCount: number;
      monthlyChange: number;
      quarterlyChange: number;
      yearlyChange: number;
    };
    past: {
      avgPrice: number;
      salesCount: number;
      monthlyChange: number;
      quarterlyChange: number;
      yearlyChange: number;
    };
  } | null;
  averageSoldPrice: {
    months: string[];
    prices: number[];
    medianPrices?: number[];
    counts: number[];
  } | null;
  averageSoldPriceByType: {
    months: string[];
    detached: number[];
    townhouse: number[];
    condo: number[];
  } | null;
  salesVolumeByType: {
    months: string[];
    [propertyType: string]: string[] | number[];
  } | null;
  inventoryOverview: {
    newListings: number;
    homesSold: number;
    avgDaysOnMarket: number;
    saleToListRatio: number;
  } | null;
  newClosedAvailable: {
    months: string[];
    new: number[];
    closed: number[];
  } | null;
  daysOnMarket: {
    months: string[];
    lastYear: number[];
    currentYear: number[];
  } | null;
}

export interface UseMarketTrendsParams {
  locationType: LocationType;
  locationName: string;
  parentCity?: string;
  parentArea?: string;
  parentNeighbourhood?: string;
  propertyType?: string;
  community?: string;
  years?: number;
}

export interface UseMarketTrendsReturn {
  data: MarketTrendsData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastFetchedAt: Date | null;
}

/**
 * Centralized hook for fetching market trends data
 * 
 * This hook ensures only ONE API call is made per filter combination,
 * preventing redundant requests from multiple components.
 * 
 * Features:
 * - Request deduplication (multiple components can use this hook without extra calls)
 * - Automatic refetch on filter changes
 * - Manual refresh capability
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useMarketTrends({
 *   locationType: 'city',
 *   locationName: 'Toronto',
 *   years: 5,
 *   propertyType: 'Detached',
 * });
 * ```
 */
export function useMarketTrends(params: UseMarketTrendsParams): UseMarketTrendsReturn {
  const {
    locationType,
    locationName,
    parentCity,
    parentArea,
    parentNeighbourhood,
    propertyType,
    community,
    years = 5,
  } = params;

  const [data, setData] = useState<MarketTrendsData>({
    priceOverview: null,
    averageSoldPrice: null,
    averageSoldPriceByType: null,
    salesVolumeByType: null,
    inventoryOverview: null,
    newClosedAvailable: null,
    daysOnMarket: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Track ongoing requests to prevent duplicate calls
  const ongoingRequestRef = useRef<Promise<void> | null>(null);
  const requestKeyRef = useRef<string>('');

  // Generate a unique key for the current request parameters
  const getRequestKey = useCallback(() => {
    return JSON.stringify({
      locationType,
      locationName,
      parentCity,
      parentArea,
      parentNeighbourhood,
      propertyType,
      community,
      years,
    });
  }, [locationType, locationName, parentCity, parentArea, parentNeighbourhood, propertyType, community, years]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const requestKey = getRequestKey();

    // If there's an ongoing request with the same key, wait for it
    if (ongoingRequestRef.current && requestKeyRef.current === requestKey && !forceRefresh) {
      console.log('[useMarketTrends] Waiting for ongoing request with same parameters');
      try {
        await ongoingRequestRef.current;
      } catch (_err) {
        // Ignore errors from the ongoing request, we'll handle our own
      }
      return;
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        // Clean location name
        const cleanLocationName = locationName
          .replace(/\s+Real\s+Estate$/i, '')
          .replace(/\s+RE$/i, '')
          .trim();

        // Build query params
        const queryParams = new URLSearchParams();
        if (parentCity) queryParams.append('parentCity', parentCity);
        if (parentArea) queryParams.append('parentArea', parentArea);
        if (parentNeighbourhood) queryParams.append('parentNeighbourhood', parentNeighbourhood);
        if (propertyType) queryParams.append('propertyType', propertyType);
        if (community) queryParams.append('community', community);
        if (years) queryParams.append('years', years.toString());
        if (forceRefresh) queryParams.append('refresh', 'true');

        const queryString = queryParams.toString();
        const apiUrl = `/api/market-trends/${locationType}/${encodeURIComponent(cleanLocationName)}${queryString ? `?${queryString}` : ''}`;

        console.log('[useMarketTrends] Fetching market trends:', {
          locationType,
          locationName: cleanLocationName,
          filters: { propertyType, community, years },
          forceRefresh,
        });

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const marketData = await response.json();

        // Update state with fetched data
        setData({
          priceOverview: marketData.priceOverview || null,
          averageSoldPrice: marketData.averageSoldPrice || null,
          averageSoldPriceByType: marketData.averageSoldPriceByType || null,
          salesVolumeByType: marketData.salesVolumeByType || null,
          inventoryOverview: marketData.inventoryOverview || null,
          newClosedAvailable: marketData.newClosedAvailable || null,
          daysOnMarket: marketData.daysOnMarket || null,
        });

        setLastFetchedAt(new Date());
        console.log('[useMarketTrends] Successfully fetched market trends data');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market trends';
        console.error('[useMarketTrends] Error fetching market trends:', err);
        setError(errorMessage);
        setData({
          priceOverview: null,
          averageSoldPrice: null,
          averageSoldPriceByType: null,
          salesVolumeByType: null,
          inventoryOverview: null,
          newClosedAvailable: null,
          daysOnMarket: null,
        });
      } finally {
        setLoading(false);
        ongoingRequestRef.current = null;
        requestKeyRef.current = '';
      }
    })();

    // Store the request promise and key
    ongoingRequestRef.current = requestPromise;
    requestKeyRef.current = requestKey;

    await requestPromise;
  }, [locationType, locationName, parentCity, parentArea, parentNeighbourhood, propertyType, community, years, getRequestKey]);

  // Fetch data when parameters change
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastFetchedAt,
  };
}

