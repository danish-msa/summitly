/**
 * Analytics Service
 * 
 * Handles market analytics and statistics:
 * - Market trends (price, days on market)
 * - New/closed listings activity
 * - Geographic-based analytics
 */

import { repliersClient, API_CONFIG } from '../client';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  minListDate?: string;
  maxListDate?: string;
  minSoldDate?: string;
  maxSoldDate?: string;
  propertyClass?: string;
  status?: string[];
}

export interface MarketDataResponse {
  apiVersion: number;
  page: number;
  numPages: number;
  pageSize: number;
  count: number;
  statistics?: {
    new?: { count: number; mth?: Record<string, { count: number }> };
    closed?: { count: number; mth?: Record<string, { count: number }> };
    avgPrice?: { count: number; mth?: Record<string, { count: number }> };
    avgDays?: { count: number; mth?: Record<string, { count: number }> };
  };
  listings: any[];
}

export interface MarketData {
  months: string[];
  prices: number[];
  days: number[];
}

export interface ListingsActivity {
  months: string[];
  newListings: number[];
  closedListings: number[];
}

export interface SoldPriceData {
  months: string[];
  medianPrices: number[];
  averagePrices: number[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get date range (default: last 6 months)
 */
function getDateRange(minDate?: string, maxDate?: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  return {
    minListDate: minDate || sixMonthsAgo.toISOString().split('T')[0],
    maxListDate: maxDate || now.toISOString().split('T')[0],
    minSoldDate: minDate || sixMonthsAgo.toISOString().split('T')[0],
    maxSoldDate: maxDate || now.toISOString().split('T')[0],
  };
}

/**
 * Generate map bounds from coordinates
 */
function generateMapBounds(lat: number, lng: number, radiusKm: number = 10): string {
  const latRange = radiusKm / 111;
  const lngRange = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const bounds = [
    [lng - lngRange, lat - latRange],
    [lng + lngRange, lat - latRange],
    [lng + lngRange, lat + latRange],
    [lng - lngRange, lat + latRange],
  ];

  return JSON.stringify([bounds]);
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get market trends (average price and days on market)
 */
export async function getMarketTrends(params: AnalyticsParams): Promise<MarketData | null> {
  const dateRange = getDateRange(params.minListDate, params.maxListDate);
  const mapBounds = generateMapBounds(params.latitude, params.longitude, params.radiusKm);

  const response = await repliersClient.request<MarketDataResponse>({
    endpoint: '/listings',
    params: {
      listings: 'false',
      status: params.status || ['U', 'A'],
      statistics: 'avg-price,avg-days,grp-mth',
      ...dateRange,
      map: mapBounds,
      ...(params.propertyClass && { class: params.propertyClass }),
    },
    authMethod: 'query',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.analytics,
    priority: 'normal',
  });

  if (response.error || !response.data?.statistics) {
    console.error('Failed to fetch market trends:', response.error?.message);
    return null;
  }

  const months: string[] = [];
  const prices: number[] = [];
  const days: number[] = [];

  const stats = response.data.statistics;
  const avgPriceMonths = Object.keys(stats.avgPrice?.mth || {});
  const avgDaysMonths = Object.keys(stats.avgDays?.mth || {});
  const allMonths = [...new Set([...avgPriceMonths, ...avgDaysMonths])].sort();

  allMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

    const priceData = stats.avgPrice?.mth?.[month];
    const daysData = stats.avgDays?.mth?.[month];

    prices.push(priceData?.count || 0);
    days.push(daysData?.count || 0);
  });

  return { months, prices, days };
}

/**
 * Get listings activity (new and closed listings by month)
 */
export async function getListingsActivity(params: AnalyticsParams): Promise<ListingsActivity | null> {
  const dateRange = getDateRange(params.minListDate, params.maxListDate);
  const mapBounds = generateMapBounds(params.latitude, params.longitude, params.radiusKm);

  const response = await repliersClient.request<MarketDataResponse>({
    endpoint: '/listings',
    params: {
      listings: 'false',
      status: params.status || ['U', 'A'],
      statistics: 'cnt-new,cnt-closed,grp-mth',
      ...dateRange,
      map: mapBounds,
      ...(params.propertyClass && { class: params.propertyClass }),
    },
    authMethod: 'query',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.analytics,
    priority: 'normal',
  });

  if (response.error || !response.data?.statistics) {
    console.error('Failed to fetch listings activity:', response.error?.message);
    return null;
  }

  const months: string[] = [];
  const newListings: number[] = [];
  const closedListings: number[] = [];

  const stats = response.data.statistics;
  const newMonths = Object.keys(stats.new?.mth || {});
  const closedMonths = Object.keys(stats.closed?.mth || {});
  const allMonths = [...new Set([...newMonths, ...closedMonths])].sort();

  allMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

    const newData = stats.new?.mth?.[month];
    const closedData = stats.closed?.mth?.[month];

    newListings.push(newData?.count || 0);
    closedListings.push(closedData?.count || 0);
  });

  return { months, newListings, closedListings };
}

/**
 * Get sold price trends (median and average sold prices by month)
 */
export async function getSoldPriceTrends(params: AnalyticsParams): Promise<SoldPriceData | null> {
  // Use 12 months for sold price data
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  const dateRange = {
    minSoldDate: twelveMonthsAgo.toISOString().split('T')[0],
    maxSoldDate: now.toISOString().split('T')[0],
  };
  
  const mapBounds = generateMapBounds(params.latitude, params.longitude, params.radiusKm);

  const response = await repliersClient.request<MarketDataResponse>({
    endpoint: '/listings',
    params: {
      listings: 'false',
      status: ['U'], // Only sold properties
      statistics: 'med-soldPrice,avg-soldPrice,grp-mth',
      ...dateRange,
      map: mapBounds,
      ...(params.propertyClass && { class: params.propertyClass }),
    },
    authMethod: 'query',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.analytics,
    priority: 'normal',
  });

  if (response.error || !response.data?.statistics) {
    console.error('Failed to fetch sold price trends:', response.error?.message);
    return null;
  }

  const months: string[] = [];
  const medianPrices: number[] = [];
  const averagePrices: number[] = [];

  const stats = response.data.statistics;
  const soldPriceMonths = Object.keys(stats.soldPrice?.mth || {});

  soldPriceMonths.sort().forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

    const monthData = stats.soldPrice?.mth?.[month];
    medianPrices.push(monthData?.med || 0);
    averagePrices.push(monthData?.avg || 0);
  });

  return { months, medianPrices, averagePrices };
}

