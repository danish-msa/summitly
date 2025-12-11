/**
 * Analytics Service - Generalized Statistics API
 * 
 * Standardized service for fetching real-time market statistics from Repliers API.
 * Supports all statistics, groupings, and aggregations as per official documentation:
 * https://help.repliers.com/en/article/real-time-market-statistics-implementation-guide-l3b1uy
 * 
 * Base URL: https://api.repliers.io/listings
 * 
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 * 
 * This file is organized into sections:
 * 1. TYPES - All TypeScript interfaces and types
 * 2. REQUEST BUILDERS - Predefined request templates for common patterns
 * 3. CORE API - The main getStatistics function
 * 4. CONVENIENCE FUNCTIONS - High-level functions that use builders
 * 
 * Usage Pattern:
 * ```typescript
 * // Use predefined builders
 * const request = AnalyticsBuilders.soldPrice.average({
 *   city: 'Toronto',
 *   dateRange: { start: '2024-01-01', end: '2024-12-31' }
 * });
 * const stats = await getStatistics(request);
 * 
 * // Or use convenience functions
 * const data = await getAverageSoldPriceData({ city: 'Toronto' });
 * ```
 */

import { repliersClient, API_CONFIG } from '../client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported Statistics Types
 */
export type StatisticType =
  // Tax Statistics
  | 'avg-tax' | 'med-tax'
  // Price Performance
  | 'pct-aboveBelowList'
  // Price per Square Foot
  | 'avg-priceSqft'
  // Property Counts
  | 'cnt-available' | 'cnt-new' | 'cnt-closed'
  // Days on Market Statistics
  | 'sd-daysOnMarket' | 'med-daysOnMarket' | 'avg-daysOnMarket' | 'sum-daysOnMarket' | 'min-daysOnMarket' | 'max-daysOnMarket'
  // List Price Statistics
  | 'sd-listPrice' | 'med-listPrice' | 'avg-listPrice' | 'sum-listPrice' | 'min-listPrice' | 'max-listPrice'
  // Sold Price Statistics
  | 'sd-soldPrice' | 'med-soldPrice' | 'avg-soldPrice' | 'sum-soldPrice' | 'min-soldPrice' | 'max-soldPrice'
  // Maintenance Fee Statistics
  | 'avg-maintenanceFee' | 'med-maintenanceFee' | 'avg-maintenanceFeePerSqft' | 'med-maintenanceFeePerSqft';

/**
 * Supported Grouping Types
 */
export type GroupingType = 'grp-day' | 'grp-mth' | 'grp-yr' | `grp-${number}-days`;

/**
 * Supported Aggregation Fields
 */
export type AggregationField =
  | 'address.neighborhood'
  | 'address.city'
  | 'address.area'
  | 'details.propertyType'
  | 'details.numBedrooms'
  | 'details.numBathrooms'
  | 'status'
  | 'lastStatus';

/**
 * Comprehensive Statistics Request Parameters
 */
export interface StatisticsRequest {
  // Location filters
  city?: string | string[];
  neighborhood?: string | string[];
  area?: string | string[];
  state?: string | string[];
  zip?: string | string[];
  
  // Geographic filters
  latitude?: number;
  longitude?: number;
  radius?: number;
  map?: string;
  
  // Property filters
  minBeds?: number;
  maxBeds?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyType?: string | string[];
  class?: string | string[];
  
  // Status filters
  status?: string | string[];
  lastStatus?: string | string[];
  
  // Date filters
  minListDate?: string;
  maxListDate?: string;
  minSoldDate?: string;
  maxSoldDate?: string;
  
  // Statistics parameters
  statistics: StatisticType | StatisticType[];
  groupings?: GroupingType | GroupingType[];
  aggregateStatistics?: boolean;
  aggregates?: AggregationField | AggregationField[];
  
  // Request options
  listings?: boolean;
  pageNum?: number;
  resultsPerPage?: number;
  
  // Additional filters
  [key: string]: unknown;
}

/**
 * Base structure for grouped statistics
 */
export interface GroupedStatisticValue {
  avg?: number;
  med?: number;
  count?: number;
  sum?: number;
  min?: number;
  max?: number;
  sd?: number;
  aggregates?: Record<string, unknown>;
}

/**
 * Grouped statistics by time period
 */
export interface GroupedStatistics {
  day?: Record<string, GroupedStatisticValue>;
  mth?: Record<string, GroupedStatisticValue>;
  yr?: Record<string, GroupedStatisticValue>;
  [key: `grp-${number}-days`]: Record<string, GroupedStatisticValue> | undefined;
}

/**
 * Statistics for a specific metric
 */
export interface MetricStatistics {
  avg?: number;
  med?: number;
  count?: number;
  sum?: number;
  min?: number;
  max?: number;
  sd?: number;
  aggregates?: Record<string, unknown>;
  day?: Record<string, GroupedStatisticValue>;
  mth?: Record<string, GroupedStatisticValue>;
  yr?: Record<string, GroupedStatisticValue>;
  [key: `grp-${number}-days`]: Record<string, GroupedStatisticValue> | undefined;
}

/**
 * Complete Statistics Response Structure
 */
export interface StatisticsResponse {
  apiVersion?: number;
  page?: number;
  numPages?: number;
  pageSize?: number;
  count?: number;
  statistics?: {
    tax?: MetricStatistics;
    aboveBelowList?: MetricStatistics;
    priceSqft?: MetricStatistics;
    available?: MetricStatistics;
    new?: MetricStatistics;
    closed?: MetricStatistics;
    listPrice?: MetricStatistics;
    soldPrice?: MetricStatistics;
    daysOnMarket?: MetricStatistics;
    maintenanceFee?: MetricStatistics;
    maintenanceFeePerSqft?: MetricStatistics;
    [key: string]: MetricStatistics | undefined;
  };
  aggregates?: Record<string, {
    count?: number;
    statistics?: {
      soldPrice?: { avg?: number; med?: number };
      daysOnMarket?: { avg?: number };
      available?: { count?: number };
      closed?: { count?: number };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  listings?: unknown[];
}

/**
 * Common location parameters
 */
export interface LocationParams {
  city?: string;
  neighborhood?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

/**
 * Date range parameters
 */
export interface DateRangeParams {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

/**
 * Legacy AnalyticsParams for backward compatibility
 */
export interface AnalyticsParams extends LocationParams {
  minListDate?: string;
  maxListDate?: string;
  minSoldDate?: string;
  maxSoldDate?: string;
  propertyClass?: string;
  propertyType?: string;
  status?: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean city name by removing common suffixes like "Real Estate", "RE", etc.
 * This ensures the API receives clean city names like "Toronto" instead of "Toronto Real Estate"
 */
function cleanCityName(cityName?: string): string | undefined {
  if (!cityName) return undefined;
  return cityName
    .replace(/\s+Real\s+Estate$/i, '')
    .replace(/\s+RE$/i, '')
    .trim();
}

function mapPropertyClassToApi(propertyClass?: string | string[]): string | string[] | undefined {
  if (!propertyClass) return undefined;
  
  if (Array.isArray(propertyClass)) {
    return propertyClass.map(p => {
      const normalized = p.toLowerCase();
      if (normalized.includes('commercial')) return 'commercial';
      if (normalized.includes('condo')) return 'condo';
      if (normalized.includes('residential')) return 'residential';
      return 'residential';
    });
  }
  
  const normalized = propertyClass.toLowerCase();
  if (normalized.includes('commercial')) return 'commercial';
  if (normalized.includes('condo')) return 'condo';
  if (normalized.includes('residential')) return 'residential';
  return 'residential';
}

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

function buildStatisticsParams(request: StatisticsRequest): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  // Location filters
  if (request.city) {
    // Clean city name if it's a string
    if (typeof request.city === 'string') {
      params.city = cleanCityName(request.city) || request.city;
    } else if (Array.isArray(request.city)) {
      params.city = request.city.map(city => cleanCityName(city) || city);
    } else {
      params.city = request.city;
    }
  }
  if (request.neighborhood) params.neighborhood = request.neighborhood;
  if (request.area) params.area = request.area;
  if (request.state) params.state = request.state;
  if (request.zip) params.zip = request.zip;
  
  // Geographic filters
  if (request.latitude !== undefined && request.longitude !== undefined && request.radius) {
    params.map = generateMapBounds(request.latitude, request.longitude, request.radius);
  } else if (request.map) {
    params.map = request.map;
  }
  
  // Property filters
  if (request.minBeds !== undefined) params.minBeds = request.minBeds;
  if (request.maxBeds !== undefined) params.maxBeds = request.maxBeds;
  if (request.minBathrooms !== undefined) params.minBathrooms = request.minBathrooms;
  if (request.maxBathrooms !== undefined) params.maxBathrooms = request.maxBathrooms;
  if (request.minPrice !== undefined) params.minPrice = request.minPrice;
  if (request.maxPrice !== undefined) params.maxPrice = request.maxPrice;
  if (request.minSqft !== undefined) params.minSqft = request.minSqft;
  if (request.maxSqft !== undefined) params.maxSqft = request.maxSqft;
  if (request.propertyType) params.propertyType = request.propertyType;
  if (request.class) {
    params.class = mapPropertyClassToApi(request.class);
  }
  
  // Status filters
  if (request.status) params.status = request.status;
  if (request.lastStatus) params.lastStatus = request.lastStatus;
  
  // Date filters
  if (request.minListDate) params.minListDate = request.minListDate;
  if (request.maxListDate) params.maxListDate = request.maxListDate;
  if (request.minSoldDate) params.minSoldDate = request.minSoldDate;
  if (request.maxSoldDate) params.maxSoldDate = request.maxSoldDate;
  
  // Statistics parameters
  if (Array.isArray(request.statistics)) {
    params.statistics = request.statistics.join(',');
  } else {
    params.statistics = request.statistics;
  }
  
  // Grouping parameters
  if (request.groupings) {
    const statsArray = Array.isArray(request.statistics) 
      ? request.statistics 
      : [request.statistics];
    const groupingsArray = Array.isArray(request.groupings)
      ? request.groupings
      : [request.groupings];
    
    params.statistics = [...statsArray, ...groupingsArray].join(',');
  }
  
  // Aggregation parameters
  if (request.aggregateStatistics) {
    params.aggregateStatistics = 'true';
    if (request.aggregates) {
      if (Array.isArray(request.aggregates)) {
        params.aggregates = request.aggregates.join(',');
      } else {
        params.aggregates = request.aggregates;
      }
    }
  }
  
  // Request options
  if (request.listings === false) {
    params.listings = 'false';
  }
  if (request.pageNum) params.pageNum = request.pageNum;
  if (request.resultsPerPage) params.resultsPerPage = request.resultsPerPage;
  
  // Additional filters
  Object.keys(request).forEach(key => {
    if (!['statistics', 'groupings', 'aggregateStatistics', 'aggregates', 'listings', 'pageNum', 'resultsPerPage'].includes(key) &&
        !['city', 'neighborhood', 'area', 'state', 'zip', 'latitude', 'longitude', 'radius', 'map'].includes(key) &&
        !['minBeds', 'maxBeds', 'minBathrooms', 'maxBathrooms', 'minPrice', 'maxPrice', 'minSqft', 'maxSqft', 'propertyType', 'class'].includes(key) &&
        !['status', 'lastStatus', 'minListDate', 'maxListDate', 'minSoldDate', 'maxSoldDate'].includes(key) &&
        request[key] !== undefined) {
      params[key] = request[key];
    }
  });
  
  return params;
}

// ============================================================================
// REQUEST BUILDERS - Predefined Templates
// ============================================================================

/**
 * Request builders for common statistics patterns
 * Use these to build requests without manually constructing StatisticsRequest objects
 */
export const AnalyticsBuilders = {
  /**
   * Sold Price Statistics Builders
   */
  soldPrice: {
    /**
     * Average sold price
     */
    average: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      aggregation?: AggregationField | AggregationField[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      lastStatus: 'Sld',
      minSoldDate: params.dateRange?.start,
      maxSoldDate: params.dateRange?.end,
      statistics: 'avg-soldPrice',
      groupings: params.grouping,
      aggregateStatistics: !!params.aggregation,
      aggregates: params.aggregation,
      listings: false,
      ...params.additionalFilters,
    }),

    /**
     * Median sold price
     */
    median: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      lastStatus: 'Sld',
      minSoldDate: params.dateRange?.start,
      maxSoldDate: params.dateRange?.end,
      statistics: 'med-soldPrice',
      groupings: params.grouping,
      listings: false,
      ...params.additionalFilters,
    }),

    /**
     * Multiple sold price statistics
     */
    multiple: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      statistics: ('avg' | 'med' | 'min' | 'max' | 'sum' | 'sd')[];
      grouping?: GroupingType | GroupingType[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      lastStatus: 'Sld',
      minSoldDate: params.dateRange?.start,
      maxSoldDate: params.dateRange?.end,
      statistics: params.statistics.map(s => `${s}-soldPrice` as StatisticType),
      groupings: params.grouping,
      listings: false,
      ...params.additionalFilters,
    }),
  },

  /**
   * List Price Statistics Builders
   */
  listPrice: {
    average: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'A',
      minListDate: params.dateRange?.start,
      maxListDate: params.dateRange?.end,
      statistics: 'avg-listPrice',
      groupings: params.grouping,
      listings: false,
      ...params.additionalFilters,
    }),

    median: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'A',
      minListDate: params.dateRange?.start,
      maxListDate: params.dateRange?.end,
      statistics: 'med-listPrice',
      groupings: params.grouping,
      listings: false,
      ...params.additionalFilters,
    }),
  },

  /**
   * Days on Market Statistics Builders
   */
  daysOnMarket: {
    average: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      minListDate: params.dateRange?.start,
      maxListDate: params.dateRange?.end,
      statistics: 'avg-daysOnMarket',
      groupings: params.grouping,
      listings: false,
      ...params.additionalFilters,
    }),

    median: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      minListDate: params.dateRange?.start,
      maxListDate: params.dateRange?.end,
      statistics: 'med-daysOnMarket',
      groupings: params.grouping,
      listings: false,
      ...params.additionalFilters,
    }),
  },

  /**
   * Count Statistics Builders
   */
  counts: {
    available: (params: {
      location: LocationParams;
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'A',
      statistics: 'cnt-available',
      listings: false,
      ...params.additionalFilters,
    }),

    new: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      aggregation?: AggregationField | AggregationField[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      minListDate: params.dateRange?.start,
      maxListDate: params.dateRange?.end,
      statistics: 'cnt-new',
      groupings: params.grouping,
      aggregateStatistics: !!params.aggregation,
      aggregates: params.aggregation,
      listings: false,
      ...params.additionalFilters,
    }),

    closed: (params: {
      location: LocationParams;
      dateRange?: DateRangeParams;
      grouping?: GroupingType | GroupingType[];
      aggregation?: AggregationField | AggregationField[];
      additionalFilters?: Partial<StatisticsRequest>;
    }): StatisticsRequest => ({
      ...params.location,
      ...(params.location.latitude && params.location.longitude && params.location.radiusKm
        ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
        : {}),
      status: 'U',
      lastStatus: 'Sld',
      minSoldDate: params.dateRange?.start,
      maxSoldDate: params.dateRange?.end,
      statistics: 'cnt-closed',
      groupings: params.grouping,
      aggregateStatistics: !!params.aggregation,
      aggregates: params.aggregation,
      listings: false,
      ...params.additionalFilters,
    }),
  },

  /**
   * Custom Statistics Builder
   * Use this for any custom combination of statistics
   */
  custom: (params: {
    location: LocationParams;
    statistics: StatisticType | StatisticType[];
    dateRange?: DateRangeParams;
    grouping?: GroupingType | GroupingType[];
    aggregation?: AggregationField | AggregationField[];
    status?: string | string[];
    lastStatus?: string | string[];
    additionalFilters?: Partial<StatisticsRequest>;
  }): StatisticsRequest => ({
    ...params.location,
    ...(params.location.latitude && params.location.longitude && params.location.radiusKm
      ? { latitude: params.location.latitude, longitude: params.location.longitude, radius: params.location.radiusKm }
      : {}),
    status: params.status || 'U',
    lastStatus: params.lastStatus,
    minListDate: params.dateRange?.start,
    maxListDate: params.dateRange?.end,
    minSoldDate: params.dateRange?.start,
    maxSoldDate: params.dateRange?.end,
    statistics: params.statistics,
    groupings: params.grouping,
    aggregateStatistics: !!params.aggregation,
    aggregates: params.aggregation,
    listings: false,
    ...params.additionalFilters,
  }),
};

// ============================================================================
// CORE API METHOD
// ============================================================================

/**
 * Generic function to fetch statistics from Repliers API
 * 
 * @param request - StatisticsRequest with all desired parameters
 * @returns StatisticsResponse with requested statistics
 */
export async function getStatistics(
  request: StatisticsRequest
): Promise<StatisticsResponse | null> {
  try {
    const params = buildStatisticsParams(request);

    const response = await repliersClient.request<StatisticsResponse>({
      endpoint: '/listings',
      params,
      authMethod: 'header',
      cache: true,
      cacheDuration: API_CONFIG.cacheDurations.analytics,
      priority: 'normal',
    });

    if (response.error) {
      console.error('[getStatistics] API Error:', {
        message: response.error.message,
        code: response.error.code,
        status: response.error.status,
        request: params,
      });
      return null;
    }

    if (!response.data) {
      console.warn('[getStatistics] No data in response');
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('[getStatistics] Exception:', error);
    return null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS - High-Level Functions Using Builders
// ============================================================================

export interface AverageSoldPriceData {
  months: string[];
  prices: number[]; // Average prices
  medianPrices: number[]; // Median prices
  counts: number[];
}

export async function getAverageSoldPriceData(params: AnalyticsParams): Promise<AverageSoldPriceData | null> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  // Fetch both average and median prices in a single call
  const request = AnalyticsBuilders.custom({
    location: {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    },
    statistics: ['avg-soldPrice', 'med-soldPrice'],
    dateRange: {
      start: params.minSoldDate || twelveMonthsAgo.toISOString().split('T')[0],
      end: params.maxSoldDate || now.toISOString().split('T')[0],
    },
    grouping: 'grp-mth',
    status: 'U',
    lastStatus: 'Sld',
    additionalFilters: {
      ...(params.propertyClass ? { class: params.propertyClass } : {}),
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
    },
  });

  const response = await getStatistics(request);
  
  if (!response?.statistics?.soldPrice?.mth) {
    return null;
  }

  const months: string[] = [];
  const prices: number[] = [];
  const medianPrices: number[] = [];
  const counts: number[] = [];
  const soldPriceMth = response.statistics.soldPrice.mth;
  const sortedMonths = Object.keys(soldPriceMth).sort();

  sortedMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    prices.push(soldPriceMth[month]?.avg || 0);
    medianPrices.push(soldPriceMth[month]?.med || 0);
    counts.push(soldPriceMth[month]?.count || 0);
  });

  return { months, prices, medianPrices, counts };
}

export interface SalesVolumeByTypeData {
  months: string[];
  detached: number[];
  townhouse: number[];
  condo: number[];
}

export async function getSalesVolumeByType(params: AnalyticsParams): Promise<SalesVolumeByTypeData | null> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  // Use avg-soldPrice with aggregation to get accurate counts by property type
  const request = AnalyticsBuilders.soldPrice.average({
    location: {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    },
    dateRange: {
      start: params.minSoldDate || twelveMonthsAgo.toISOString().split('T')[0],
      end: params.maxSoldDate || now.toISOString().split('T')[0],
    },
    grouping: 'grp-mth',
    aggregation: 'details.propertyType',
    additionalFilters: {
      ...(params.propertyClass ? { class: params.propertyClass } : {}),
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
    },
  });

  const response = await getStatistics(request);
  
  if (!response?.statistics?.soldPrice?.mth) {
    return null;
  }

  const months: string[] = [];
  const detached: number[] = [];
  const townhouse: number[] = [];
  const condo: number[] = [];

  const soldPriceMth = response.statistics.soldPrice.mth;
  const sortedMonths = Object.keys(soldPriceMth).sort();

  sortedMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    const monthData = soldPriceMth[month];
    const aggregates = monthData?.aggregates as Record<string, unknown> | undefined;
    const propertyTypeAggregates = (aggregates?.details as Record<string, unknown> | undefined)?.propertyType as Record<string, { count?: number }> | undefined || {};
    
    // Map API property types to our chart categories:
    // "Detached" -> detached
    // "Condo Apartment" -> condo
    // "Condo Townhouse" -> townhouse
    detached.push(propertyTypeAggregates['Detached']?.count || 0);
    townhouse.push(propertyTypeAggregates['Condo Townhouse']?.count || 0);
    condo.push(propertyTypeAggregates['Condo Apartment']?.count || 0);
  });

  return { months, detached, townhouse, condo };
}

export interface AverageSoldPriceByTypeData {
  months: string[];
  detached: number[]; // Average prices per month
  townhouse: number[]; // Average prices per month
  condo: number[]; // Average prices per month
}

export async function getAverageSoldPriceByType(params: AnalyticsParams): Promise<AverageSoldPriceByTypeData | null> {
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  
  // Fetch average sold price with aggregation by property type
  const request = AnalyticsBuilders.soldPrice.average({
    location: {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    },
    dateRange: {
      start: params.minSoldDate || twoYearsAgo.toISOString().split('T')[0],
      end: params.maxSoldDate || now.toISOString().split('T')[0],
    },
    grouping: 'grp-mth',
    aggregation: 'details.propertyType',
    additionalFilters: {
      ...(params.propertyClass ? { class: params.propertyClass } : {}),
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
    },
  });

  const response = await getStatistics(request);
  
  if (!response?.statistics?.soldPrice?.mth) {
    return null;
  }

  const months: string[] = [];
  const detached: number[] = [];
  const townhouse: number[] = [];
  const condo: number[] = [];

  const soldPriceMth = response.statistics.soldPrice.mth;
  const sortedMonths = Object.keys(soldPriceMth).sort();

  sortedMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    const monthData = soldPriceMth[month];
    const aggregates = monthData?.aggregates as Record<string, unknown> | undefined;
    const propertyTypeAggregates = (aggregates?.details as Record<string, unknown> | undefined)?.propertyType as Record<string, { avg?: number }> | undefined || {};
    
    // Map API property types to our chart categories and get average prices:
    // "Detached" -> detached
    // "Condo Apartment" -> condo
    // "Condo Townhouse" -> townhouse
    // Convert to thousands (PSF) for display
    const detachedPrice = propertyTypeAggregates['Detached']?.avg || 0;
    const townhousePrice = propertyTypeAggregates['Condo Townhouse']?.avg || 0;
    const condoPrice = propertyTypeAggregates['Condo Apartment']?.avg || 0;
    
    detached.push(detachedPrice > 0 ? Math.round(detachedPrice / 1000) : 0);
    townhouse.push(townhousePrice > 0 ? Math.round(townhousePrice / 1000) : 0);
    condo.push(condoPrice > 0 ? Math.round(condoPrice / 1000) : 0);
  });

  return { months, detached, townhouse, condo };
}

export interface PriceOverviewData {
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
}

function parseDateRange(dateRangeStr: string): { start: Date; end: Date } | null {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const parts = dateRangeStr.split(' - ');
    if (parts.length !== 2) return null;

    // Format dates as YYYY-MM-DD strings directly from the input to ensure exact dates
    const formatDateString = (dateStr: string): string => {
      const months: Record<string, number> = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };
      const [monthStr, dayStr] = dateStr.trim().split(' ');
      const month = months[monthStr];
      const day = parseInt(dayStr, 10);
      
      if (!month || isNaN(day)) {
        console.error('[parseDateRange] Invalid date part:', dateStr);
        return '';
      }
      
      return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };
    
    const startStr = formatDateString(parts[0]);
    const endStr = formatDateString(parts[1]);
    
    if (!startStr || !endStr) {
      console.error('[parseDateRange] Failed to format dates:', { startStr, endStr });
      return null;
    }
    
    // Create dates from formatted strings (using UTC to avoid timezone shifts)
    const start = new Date(startStr + 'T00:00:00Z');
    const end = new Date(endStr + 'T00:00:00Z');
    
    // Log parsed dates for debugging
    console.log('[parseDateRange] Parsed dates:', {
      input: dateRangeStr,
      startFormatted: startStr,
      endFormatted: endStr,
      startISO: start.toISOString().split('T')[0],
      endISO: end.toISOString().split('T')[0],
    });
    
    return { start, end };
  } catch (error) {
    console.error('[parseDateRange] Error:', error);
    return null;
  }
}

export async function getPriceOverview(
  params: AnalyticsParams,
  dateRanges?: { current: string; past: string }
): Promise<PriceOverviewData | null> {
  let currentStart: Date;
  let currentEnd: Date;
  let pastStart: Date;
  let pastEnd: Date;

  if (dateRanges) {
    const currentRange = parseDateRange(dateRanges.current);
    const pastRange = parseDateRange(dateRanges.past);
    
    if (!currentRange || !pastRange) {
      console.error('[getPriceOverview] Failed to parse date ranges:', { 
        current: dateRanges.current, 
        past: dateRanges.past,
        currentRange,
        pastRange
      });
      return null;
    }
    
    currentStart = currentRange.start;
    currentEnd = currentRange.end;
    pastStart = pastRange.start;
    pastEnd = pastRange.end;
  } else {
    const now = new Date();
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 28);
    
    pastEnd = new Date(currentStart);
    pastEnd.setDate(pastEnd.getDate() - 1);
    pastStart = new Date(pastEnd);
    pastStart.setDate(pastStart.getDate() - 28);
  }

  const now = new Date();
  // Calculate date ranges for comparison periods
  // We need data going back 1 year to calculate all comparisons
  const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  const locationParams: LocationParams = {
    city: params.city,
    neighborhood: params.neighborhood,
    area: params.area,
    latitude: params.latitude,
    longitude: params.longitude,
    radiusKm: params.radiusKm,
  };

  try {
    const currentStartStr = currentStart.toISOString().split('T')[0];
    const currentEndStr = currentEnd.toISOString().split('T')[0];
    const pastStartStr = pastStart.toISOString().split('T')[0];
    const pastEndStr = pastEnd.toISOString().split('T')[0];
    
    // OPTIMIZATION: Instead of 5 separate API calls, make 2 calls:
    // 1. Current period with monthly grouping (includes overall avg + monthly breakdown)
    // 2. Past period with monthly grouping (includes overall avg + monthly breakdown)
    // 3. One large call for the last year with monthly grouping (for comparison calculations)
    
    const [currentPeriod, pastPeriod, historicalData] = await Promise.all([
      getStatistics(AnalyticsBuilders.soldPrice.average({
        location: locationParams,
        dateRange: {
          start: currentStartStr,
          end: currentEndStr,
        },
        grouping: 'grp-mth',
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
      getStatistics(AnalyticsBuilders.soldPrice.average({
        location: locationParams,
        dateRange: {
          start: pastStartStr,
          end: pastEndStr,
        },
        grouping: 'grp-mth',
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
      getStatistics(AnalyticsBuilders.soldPrice.average({
        location: locationParams,
        dateRange: {
          start: oneYearAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
        grouping: 'grp-mth',
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
    ]);

    // Extract overall averages and counts for current and past periods
    const currentAvg = currentPeriod?.statistics?.soldPrice?.avg ?? 0;
    const pastAvg = pastPeriod?.statistics?.soldPrice?.avg ?? 0;
    const currentSalesCount = currentPeriod?.count ?? 0;
    const pastSalesCount = pastPeriod?.count ?? 0;
    
    // Extract monthly data for accurate month-over-month comparison
    const historicalMonthly = historicalData?.statistics?.soldPrice?.mth || {};
    const currentMonthly = currentPeriod?.statistics?.soldPrice?.mth || {};
    const pastMonthly = pastPeriod?.statistics?.soldPrice?.mth || {};
    
    // Get sorted months from historical data
    const sortedMonths = Object.keys(historicalMonthly).sort();
    
    // Calculate monthly change: Compare current month vs previous month
    // Use the most recent month and the previous month from historical data
    // This gives accurate month-over-month comparison regardless of the current period's date range
    let currentMonthAvg = 0;
    let previousMonthAvg = 0;
    
    if (sortedMonths.length >= 2) {
      // Get the most recent month and the previous month
      // Note: The most recent month might be the current month (even if incomplete)
      // but we compare it to the previous complete month for consistency
      const mostRecentMonth = sortedMonths[sortedMonths.length - 1];
      const previousMonth = sortedMonths[sortedMonths.length - 2];
      
      currentMonthAvg = historicalMonthly[mostRecentMonth]?.avg || 0;
      previousMonthAvg = historicalMonthly[previousMonth]?.avg || 0;
    } else if (sortedMonths.length === 1) {
      // Only one month of data available - can't calculate monthly change
      currentMonthAvg = historicalMonthly[sortedMonths[0]]?.avg || 0;
      previousMonthAvg = 0;
    }
    
    // Calculate quarterly change: Compare last 3 months vs previous 3 months
    let quarterlyChange = 0;
    if (sortedMonths.length >= 6) {
      const last3Months = sortedMonths.slice(-3);
      const prev3Months = sortedMonths.slice(-6, -3);
      
      const last3Avg = last3Months.reduce((sum, month) => {
        return sum + (historicalMonthly[month]?.avg || 0);
      }, 0) / last3Months.length;
      
      const prev3Avg = prev3Months.reduce((sum, month) => {
        return sum + (historicalMonthly[month]?.avg || 0);
      }, 0) / prev3Months.length;
      
      if (prev3Avg > 0) {
        quarterlyChange = ((last3Avg - prev3Avg) / prev3Avg) * 100;
      }
    }
    
    // Calculate yearly change: Compare last 12 months vs previous 12 months (if available)
    // Or compare current month vs same month last year
    let yearlyChange = 0;
    if (sortedMonths.length >= 12) {
      const last12Months = sortedMonths.slice(-12);
      const prev12Months = sortedMonths.slice(-24, -12);
      
      if (prev12Months.length > 0) {
        const last12Avg = last12Months.reduce((sum, month) => {
          return sum + (historicalMonthly[month]?.avg || 0);
        }, 0) / last12Months.length;
        
        const prev12Avg = prev12Months.reduce((sum, month) => {
          return sum + (historicalMonthly[month]?.avg || 0);
        }, 0) / prev12Months.length;
        
        if (prev12Avg > 0) {
          yearlyChange = ((last12Avg - prev12Avg) / prev12Avg) * 100;
        }
      }
    } else if (sortedMonths.length >= 1) {
      // Compare current month vs same month last year
      const currentMonth = sortedMonths[sortedMonths.length - 1];
      const [year, month] = currentMonth.split('-');
      const previousYearMonth = `${parseInt(year) - 1}-${month}`;
      
      const currentMonthValue = historicalMonthly[currentMonth]?.avg || 0;
      const previousYearValue = historicalMonthly[previousYearMonth]?.avg || 0;
      
      if (previousYearValue > 0) {
        yearlyChange = ((currentMonthValue - previousYearValue) / previousYearValue) * 100;
      }
    }
    
    // Calculate monthly change for current period
    const monthlyChange = previousMonthAvg > 0 
      ? ((currentMonthAvg - previousMonthAvg) / previousMonthAvg) * 100 
      : 0;
    
    // Calculate changes for past period (similar logic but using past period data)
    const pastSortedMonths = Object.keys(pastMonthly).sort();
    let pastMonthlyChange = 0;
    let pastQuarterlyChange = 0;
    let pastYearlyChange = 0;
    
    if (pastSortedMonths.length >= 2) {
      const pastMostRecentMonth = pastSortedMonths[pastSortedMonths.length - 1];
      const pastPreviousMonth = pastSortedMonths[pastSortedMonths.length - 2];
      
      const pastCurrentMonthAvg = pastMonthly[pastMostRecentMonth]?.avg || 0;
      const pastPreviousMonthAvg = pastMonthly[pastPreviousMonth]?.avg || 0;
      
      if (pastPreviousMonthAvg > 0) {
        pastMonthlyChange = ((pastCurrentMonthAvg - pastPreviousMonthAvg) / pastPreviousMonthAvg) * 100;
      }
    }
    
    // For past period quarterly and yearly changes, use historical data if available
    if (pastSortedMonths.length >= 6) {
      const pastLast3Months = pastSortedMonths.slice(-3);
      const pastPrev3Months = pastSortedMonths.slice(-6, -3);
      
      const pastLast3Avg = pastLast3Months.reduce((sum, month) => {
        return sum + (pastMonthly[month]?.avg || 0);
      }, 0) / pastLast3Months.length;
      
      const pastPrev3Avg = pastPrev3Months.reduce((sum, month) => {
        return sum + (pastMonthly[month]?.avg || 0);
      }, 0) / pastPrev3Months.length;
      
      if (pastPrev3Avg > 0) {
        pastQuarterlyChange = ((pastLast3Avg - pastPrev3Avg) / pastPrev3Avg) * 100;
      }
    }
    
    // Past yearly change - compare to same period one year earlier
    if (pastSortedMonths.length >= 1) {
      const pastCurrentMonth = pastSortedMonths[pastSortedMonths.length - 1];
      const [year, month] = pastCurrentMonth.split('-');
      const pastPreviousYearMonth = `${parseInt(year) - 1}-${month}`;
      
      const pastCurrentMonthValue = pastMonthly[pastCurrentMonth]?.avg || 0;
      const pastPreviousYearValue = historicalMonthly[pastPreviousYearMonth]?.avg || 0;
      
      if (pastPreviousYearValue > 0) {
        pastYearlyChange = ((pastCurrentMonthValue - pastPreviousYearValue) / pastPreviousYearValue) * 100;
      }
    }

    return {
      current: {
        avgPrice: Math.round(currentAvg),
        salesCount: currentSalesCount,
        monthlyChange: Math.round(monthlyChange * 10) / 10,
        quarterlyChange: Math.round(quarterlyChange * 10) / 10,
        yearlyChange: Math.round(yearlyChange * 10) / 10,
      },
      past: {
        avgPrice: Math.round(pastAvg),
        salesCount: pastSalesCount,
        monthlyChange: Math.round(pastMonthlyChange * 10) / 10,
        quarterlyChange: Math.round(pastQuarterlyChange * 10) / 10,
        yearlyChange: Math.round(pastYearlyChange * 10) / 10,
      },
    };
  } catch (error) {
    console.error('[getPriceOverview] Exception:', error);
    return null;
  }
}

export interface PriceByBedroomsData {
  detached: Array<{
    bedroom: string;
    current: number;
    threeMonthsAgo: number;
    sixMonthsAgo: number;
    oneYearAgo: number;
    yoyChange: number;
  }>;
  townhouse: Array<{
    bedroom: string;
    current: number;
    threeMonthsAgo: number;
    sixMonthsAgo: number;
    oneYearAgo: number;
    yoyChange: number;
  }>;
  condo: Array<{
    bedroom: string;
    current: number;
    threeMonthsAgo: number;
    sixMonthsAgo: number;
    oneYearAgo: number;
    yoyChange: number;
  }>;
}

export async function getPriceByBedrooms(params: AnalyticsParams): Promise<PriceByBedroomsData | null> {
  return null; // Placeholder - requires complex aggregation
}

// Legacy functions maintained for backward compatibility
export interface MarketData {
  months: string[];
  prices: number[];
  days: number[];
}

export async function getMarketTrends(params: AnalyticsParams): Promise<MarketData | null> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 12);
  
  const request = AnalyticsBuilders.custom({
    location: {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    },
    statistics: ['med-soldPrice', 'avg-soldPrice'],
    dateRange: {
      start: params.minSoldDate || twelveMonthsAgo.toISOString().split('T')[0],
      end: params.maxSoldDate || now.toISOString().split('T')[0],
    },
    grouping: 'grp-mth',
    status: 'U',
    additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
  });

  const response = await getStatistics(request);
  
  if (!response?.statistics?.soldPrice?.mth) {
    return null;
  }

  const months: string[] = [];
  const prices: number[] = [];
  const averagePrices: number[] = [];

  const soldPriceMth = response.statistics.soldPrice.mth;
  const sortedMonths = Object.keys(soldPriceMth).sort();

  sortedMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    prices.push(soldPriceMth[month]?.med || 0);
    averagePrices.push(soldPriceMth[month]?.avg || 0);
  });

  return { months, prices, days: averagePrices };
}

export interface ListingsActivity {
  months: string[];
  newListings: number[];
  closedListings: number[];
}

export async function getListingsActivity(params: AnalyticsParams): Promise<ListingsActivity | null> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const request = AnalyticsBuilders.custom({
    location: {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    },
    statistics: ['cnt-new', 'cnt-closed'],
    dateRange: {
      start: params.minListDate || sixMonthsAgo.toISOString().split('T')[0],
      end: params.maxListDate || now.toISOString().split('T')[0],
    },
    grouping: 'grp-mth',
    status: 'U',
    additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
  });

  const response = await getStatistics(request);
  
  if (!response?.statistics) {
    return null;
  }

  const months: string[] = [];
  const newListings: number[] = [];
  const closedListings: number[] = [];

  const newMth = response.statistics.new?.mth || {};
  const closedMth = response.statistics.closed?.mth || {};
  const allMonths = [...new Set([...Object.keys(newMth), ...Object.keys(closedMth)])].sort();

  allMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    newListings.push(newMth[month]?.count || 0);
    closedListings.push(closedMth[month]?.count || 0);
  });

  return { months, newListings, closedListings };
}

export interface SoldPriceData {
  months: string[];
  medianPrices: number[];
  averagePrices: number[];
}

export async function getSoldPriceTrends(params: AnalyticsParams): Promise<SoldPriceData | null> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  const request = AnalyticsBuilders.custom({
    location: {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    },
    statistics: ['med-soldPrice', 'avg-soldPrice'],
    dateRange: {
      start: params.minSoldDate || twelveMonthsAgo.toISOString().split('T')[0],
      end: params.maxSoldDate || now.toISOString().split('T')[0],
    },
    grouping: 'grp-mth',
    status: 'U',
    lastStatus: 'Sld',
    additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
  });

  const response = await getStatistics(request);
  
  if (!response?.statistics?.soldPrice?.mth) {
    return null;
  }

  const months: string[] = [];
  const medianPrices: number[] = [];
  const averagePrices: number[] = [];

  const soldPriceMth = response.statistics.soldPrice.mth;
  const sortedMonths = Object.keys(soldPriceMth).sort();

  sortedMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    medianPrices.push(soldPriceMth[month]?.med || 0);
    averagePrices.push(soldPriceMth[month]?.avg || 0);
  });

  return { months, medianPrices, averagePrices };
}

export interface MarketSummaryStats {
  activeListings: number;
  newListings: number;
  soldProperties: number;
  medianPrice: number;
  avgDOM: number;
  last1YearGrowth: number;
  last5YearsGrowth: number;
}

export async function getMarketSummaryStats(params: AnalyticsParams): Promise<MarketSummaryStats | null> {
  try {
    const locationParams: LocationParams = {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    };

    const additionalFilters = params.propertyClass ? { class: params.propertyClass } : {};

    const [activeResponse, summaryResponse] = await Promise.all([
      getStatistics(AnalyticsBuilders.counts.available({
        location: locationParams,
        additionalFilters,
      })),
      getStatistics(AnalyticsBuilders.custom({
        location: locationParams,
        statistics: ['cnt-new', 'cnt-closed', 'med-soldPrice', 'avg-daysOnMarket'],
        status: 'U',
        additionalFilters,
      })),
    ]);

    const activeListings = activeResponse?.statistics?.available?.count || 0;
    const newListings = summaryResponse?.statistics?.new?.count || 0;
    const soldProperties = summaryResponse?.statistics?.closed?.count || 0;
    const medianPrice = summaryResponse?.statistics?.soldPrice?.med || 0;
    const avgDOM = Math.round(summaryResponse?.statistics?.daysOnMarket?.avg || 0);

    const now = new Date();
    const fiveYearsAgo = new Date(now);
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    const historicalResponse = await getStatistics(AnalyticsBuilders.soldPrice.median({
      location: locationParams,
      dateRange: {
        start: fiveYearsAgo.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
      grouping: 'grp-mth',
      additionalFilters,
    }));

    let last1YearGrowth = 0;
    let last5YearsGrowth = 0;

    if (historicalResponse?.statistics?.soldPrice?.mth) {
      const soldPriceMth = historicalResponse.statistics.soldPrice.mth;
      const months = Object.keys(soldPriceMth).sort();
      
      if (months.length > 0) {
        const currentPrice = medianPrice || soldPriceMth[months[months.length - 1]]?.med || 0;
        const oneYearAgoMonth = months.length >= 12 ? months[months.length - 12] : months[0];
        const oneYearAgoPrice = soldPriceMth[oneYearAgoMonth]?.med || currentPrice;
        const fiveYearsAgoPrice = soldPriceMth[months[0]]?.med || currentPrice;

        if (oneYearAgoPrice > 0) {
          last1YearGrowth = ((currentPrice - oneYearAgoPrice) / oneYearAgoPrice) * 100;
        }
        if (fiveYearsAgoPrice > 0) {
          last5YearsGrowth = ((currentPrice - fiveYearsAgoPrice) / fiveYearsAgoPrice) * 100;
        }
      }
    }

    return {
      activeListings,
      newListings,
      soldProperties,
      medianPrice,
      avgDOM,
      last1YearGrowth: Math.round(last1YearGrowth * 10) / 10,
      last5YearsGrowth: Math.round(last5YearsGrowth * 10) / 10,
    };
  } catch (error) {
    console.error('[getMarketSummaryStats] Exception:', error);
    return null;
  }
}

export interface InventoryOverviewData {
  newListings: number;
  homesSold: number;
  avgDaysOnMarket: number;
  saleToListRatio: number;
}

export async function getInventoryOverview(
  params: AnalyticsParams,
  dateRanges?: { current: string; past: string }
): Promise<InventoryOverviewData | null> {
  try {
    let currentStart: Date;
    let currentEnd: Date;

    if (dateRanges) {
      const currentRange = parseDateRange(dateRanges.current);
      if (!currentRange) {
        console.error('[getInventoryOverview] Failed to parse current date range:', dateRanges.current);
        return null;
      }
      currentStart = currentRange.start;
      currentEnd = currentRange.end;
    } else {
      const now = new Date();
      currentEnd = new Date(now);
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 28);
    }

    const locationParams: LocationParams = {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    };

    const currentStartStr = currentStart.toISOString().split('T')[0];
    const currentEndStr = currentEnd.toISOString().split('T')[0];

    const [newListingsResponse, closedResponse, domResponse, saleToListResponse] = await Promise.all([
      getStatistics(AnalyticsBuilders.counts.new({
        location: locationParams,
        dateRange: {
          start: currentStartStr,
          end: currentEndStr,
        },
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
      getStatistics(AnalyticsBuilders.counts.closed({
        location: locationParams,
        dateRange: {
          start: currentStartStr,
          end: currentEndStr,
        },
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
      getStatistics(AnalyticsBuilders.daysOnMarket.average({
        location: locationParams,
        dateRange: {
          start: currentStartStr,
          end: currentEndStr,
        },
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
      getStatistics(AnalyticsBuilders.custom({
        location: locationParams,
        statistics: 'pct-aboveBelowList',
        dateRange: {
          start: currentStartStr,
          end: currentEndStr,
        },
        status: 'U',
        lastStatus: 'Sld',
        additionalFilters: {
          ...(params.propertyClass ? { class: params.propertyClass } : {}),
          ...(params.propertyType ? { propertyType: params.propertyType } : {}),
        },
      })),
    ]);

    const newListings = newListingsResponse?.count || 0;
    const homesSold = closedResponse?.count || 0;
    const avgDaysOnMarket = Math.round(domResponse?.statistics?.daysOnMarket?.avg || 0);
    
    // Sale to list ratio - pct-aboveBelowList gives percentage above/below, we need to convert to ratio
    // If pct-aboveBelowList is 2%, that means 2% above list, so ratio is 102%
    const aboveBelowList = saleToListResponse?.statistics?.aboveBelowList?.avg || 0;
    const saleToListRatio = Math.round(100 + aboveBelowList);

    return {
      newListings,
      homesSold,
      avgDaysOnMarket,
      saleToListRatio,
    };
  } catch (error) {
    console.error('[getInventoryOverview] Exception:', error);
    return null;
  }
}

export interface SalesAndInventoryData {
  months: string[];
  sales: number[];
  inventory: number[];
}

export async function getSalesAndInventoryData(params: AnalyticsParams): Promise<SalesAndInventoryData | null> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  const locationParams: LocationParams = {
    city: params.city,
    neighborhood: params.neighborhood,
    area: params.area,
    latitude: params.latitude,
    longitude: params.longitude,
    radiusKm: params.radiusKm,
  };

  const [salesResponse, inventoryResponse] = await Promise.all([
    getStatistics(AnalyticsBuilders.counts.closed({
      location: locationParams,
      dateRange: {
        start: params.minSoldDate || twelveMonthsAgo.toISOString().split('T')[0],
        end: params.maxSoldDate || now.toISOString().split('T')[0],
      },
      grouping: 'grp-mth',
      additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
    })),
    getStatistics(AnalyticsBuilders.counts.available({
      location: locationParams,
      additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
    })),
  ]);

  if (!salesResponse?.statistics?.closed?.mth) {
    return null;
  }

  const months: string[] = [];
  const sales: number[] = [];
  const inventory: number[] = [];

  const closedMth = salesResponse.statistics.closed.mth;
  const sortedMonths = Object.keys(closedMth).sort();
  const activeInventory = inventoryResponse?.statistics?.available?.count || 0;

  sortedMonths.forEach((month) => {
    const date = new Date(month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    sales.push(closedMth[month]?.count || 0);
    // For inventory, we use the current active inventory count for all months
    // In a real scenario, you might want historical inventory data if available
    inventory.push(activeInventory);
  });

  return { months, sales, inventory };
}

export interface NewClosedAvailableData {
  months: string[];
  new: number[];
  closed: number[];
}

export async function getNewClosedAvailableData(
  params: AnalyticsParams,
  dateRanges?: { current: string; past: string }
): Promise<NewClosedAvailableData | null> {
  try {
    const now = new Date();
    // For the graph, we want last 12 months of data, not just the current period
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    
    const locationParams: LocationParams = {
      city: params.city,
      neighborhood: params.neighborhood,
      area: params.area,
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    };

    const startDateStr = params.minSoldDate || twelveMonthsAgo.toISOString().split('T')[0];
    const endDateStr = params.maxSoldDate || now.toISOString().split('T')[0];

    // Get new and closed counts with monthly grouping
    const newClosedResponse = await getStatistics(AnalyticsBuilders.custom({
      location: locationParams,
      statistics: ['cnt-new', 'cnt-closed'],
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
      grouping: 'grp-mth',
      status: 'U',
      lastStatus: 'Sld', // For closed, we want sold listings
      additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
    }));

    if (!newClosedResponse?.statistics) {
      return null;
    }

    const months: string[] = [];
    const newCounts: number[] = [];
    const closedCounts: number[] = [];

    const newMth = newClosedResponse.statistics.new?.mth || {};
    const closedMth = newClosedResponse.statistics.closed?.mth || {};

    // Get all months from new and closed data
    const allMonths = [...new Set([
      ...Object.keys(newMth),
      ...Object.keys(closedMth)
    ])].sort();

    allMonths.forEach((month) => {
      const date = new Date(month + '-01');
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      newCounts.push(newMth[month]?.count || 0);
      closedCounts.push(closedMth[month]?.count || 0);
    });

    return { months, new: newCounts, closed: closedCounts };
  } catch (error) {
    console.error('[getNewClosedAvailableData] Exception:', error);
    return null;
  }
}

export interface CityRankingData {
  city: string;
  averagePrice: number;
  medianPrice: number;
  priceGrowth: number;
  daysOnMarket: number;
  turnover: number;
  // Internal fields for calculation (not in final output)
  closedCount?: number;
  closedCount28Days?: number;
  newListingsCount?: number;
  historicalAvgPrice?: number;
}

export interface RankingData {
  price: Array<{
    rank: number;
    city: string;
    averagePrice: number;
    medianPrice: number;
    isCurrentCity: boolean;
  }>;
  growth: Array<{
    rank: number;
    city: string;
    priceGrowth: number;
    isCurrentCity: boolean;
  }>;
  daysOnMarket: Array<{
    rank: number;
    city: string;
    daysOnMarket: number;
    isCurrentCity: boolean;
  }>;
  turnover: Array<{
    rank: number;
    city: string;
    turnover: number;
    isCurrentCity: boolean;
  }>;
}

export interface RankingOverviewData {
  mostExpensive: number;
  fastestGrowing: number;
  fastestSelling: number;
  highestTurnover: number;
}

// Helper function to batch promises with concurrency limit
async function batchPromises<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults.map((result) => 
      result.status === 'fulfilled' ? result.value : null
    ));
  }
  return results;
}

// Get ranking data for multiple cities efficiently using aggregated API calls
// This reduces from ~90 API calls (3 per city × 30 cities) to just 3 API calls total
export async function getCityRankings(
  cities: string[],
  currentCityName: string
): Promise<{ rankings: RankingData; overview: RankingOverviewData } | null> {
  try {
    const now = new Date();
    // Current period: last 3 months
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    // Historical period: same 3-month period from 1 year ago (for year-over-year comparison)
    const oneYearAgoStart = new Date(now.getFullYear() - 1, now.getMonth() - 3, 1);
    const oneYearAgoEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    console.log(`[getCityRankings] Using aggregated API calls for ${cities.length} cities`);
    
    // Fetch current and historical stats using aggregated calls (2 calls)
    // Note: cnt-available doesn't support aggregation, so we'll fetch it separately
    const [currentStatsResponse, historicalStatsResponse] = await Promise.all([
      // Current period stats (last 3 months) - aggregated by city
      getStatistics({
        statistics: ['avg-soldPrice', 'med-soldPrice', 'avg-daysOnMarket', 'cnt-closed'],
        status: 'U',
        lastStatus: 'Sld',
        minSoldDate: threeMonthsAgo.toISOString().split('T')[0],
        maxSoldDate: now.toISOString().split('T')[0],
        aggregateStatistics: true,
        aggregates: 'address.city',
        listings: false,
      }),
      // Historical stats (same period one year ago) - aggregated by city
      // This compares the same 3-month period from last year for accurate YoY growth
      getStatistics({
        statistics: ['avg-soldPrice'],
        status: 'U',
        lastStatus: 'Sld',
        minSoldDate: oneYearAgoStart.toISOString().split('T')[0],
        maxSoldDate: oneYearAgoEnd.toISOString().split('T')[0],
        aggregateStatistics: true,
        aggregates: 'address.city',
        listings: false,
      }),
    ]);

    // Fetch new listings and closed listings per city for the last 28 days (for turnover calculation)
    // Turnover = (homes sold / listings added in last 28 days) * 100
    // Batch these calls to avoid overwhelming the API
    const twentyEightDaysAgo = new Date(now);
    twentyEightDaysAgo.setDate(now.getDate() - 28);
    
    const fetchTurnoverData = async (city: string): Promise<{ city: string; newCount: number; closedCount: number }> => {
      const cleanCityName = city
        .replace(/\s+Real\s+Estate$/i, '')
        .replace(/\s+RE$/i, '')
        .trim();
      
      const [newResponse, closedResponse] = await Promise.all([
        getStatistics({
          statistics: ['cnt-new'],
          city: cleanCityName,
          status: 'U',
          minListDate: twentyEightDaysAgo.toISOString().split('T')[0],
          maxListDate: now.toISOString().split('T')[0],
          listings: false,
        }),
        getStatistics({
          statistics: ['cnt-closed'],
          city: cleanCityName,
          status: 'U',
          lastStatus: 'Sld',
          minSoldDate: twentyEightDaysAgo.toISOString().split('T')[0],
          maxSoldDate: now.toISOString().split('T')[0],
          listings: false,
        }),
      ]);
      
      return {
        city,
        newCount: newResponse?.statistics?.new?.count || 1, // Default to 1 to avoid division by zero
        closedCount: closedResponse?.statistics?.closed?.count || 0,
      };
    };

    // Fetch turnover data in batches of 10 cities at a time
    const turnoverDataArray = await batchPromises(cities, 10, fetchTurnoverData);
    const newListingsCountsMap = new Map<string, number>();
    const closedCounts28DaysMap = new Map<string, number>();
    // Filter out null values before iterating
    turnoverDataArray
      .filter((item): item is { city: string; newCount: number; closedCount: number } => item !== null)
      .forEach(({ city, newCount, closedCount }) => {
        if (city) {
          if (newCount) {
            newListingsCountsMap.set(city, newCount);
          }
          if (closedCount !== undefined) {
            closedCounts28DaysMap.set(city, closedCount);
          }
        }
      });

    // Debug: Log the response structure to understand the format
    console.log('[getCityRankings] Current stats response structure:', {
      hasAggregates: !!currentStatsResponse?.aggregates,
      aggregatesKeys: currentStatsResponse?.aggregates ? Object.keys(currentStatsResponse.aggregates).slice(0, 5) : [],
      hasStatistics: !!currentStatsResponse?.statistics,
      statisticsKeys: currentStatsResponse?.statistics ? Object.keys(currentStatsResponse.statistics) : [],
      count: currentStatsResponse?.count,
      responseKeys: Object.keys(currentStatsResponse || {}),
    });

    // Parse aggregated responses to extract city-level data
    const cityDataMap = new Map<string, Partial<CityRankingData>>();

    // Process current stats (avg-soldPrice, med-soldPrice, avg-daysOnMarket, cnt-closed)
    // Based on API response structure: statistics.soldPrice.aggregates.address.city
    const currentYear = new Date().getFullYear().toString();
    // Type assertion needed because aggregates is Record<string, unknown>
    const soldPriceAggregates = (currentStatsResponse?.statistics?.soldPrice?.aggregates as { address?: { city?: Record<string, { avg?: number; med?: number }> } })?.address?.city;
    const daysOnMarketAggregates = (currentStatsResponse?.statistics?.daysOnMarket?.aggregates as { address?: { city?: Record<string, { avg?: number }> } })?.address?.city;
    const closedAggregates = (currentStatsResponse?.statistics?.closed?.yr?.[currentYear]?.aggregates as { address?: { city?: Record<string, { count?: number }> } })?.address?.city;

    // Process sold price aggregates (avg, med)
    if (soldPriceAggregates && typeof soldPriceAggregates === 'object') {
      console.log('[getCityRankings] Processing soldPrice aggregates, found cities:', Object.keys(soldPriceAggregates).length);
      Object.keys(soldPriceAggregates).forEach((city) => {
        const cityData = soldPriceAggregates[city];
        if (!cityDataMap.has(city)) {
          cityDataMap.set(city, { city });
        }
        const data = cityDataMap.get(city)!;
        data.averagePrice = Math.round(cityData?.avg || 0);
        data.medianPrice = Math.round(cityData?.med || 0);
        // closedCount comes from closedAggregates, not soldPriceAggregates
      });
    } else {
      console.warn('[getCityRankings] No soldPrice aggregates found in current stats response');
    }

    // Process days on market aggregates
    if (daysOnMarketAggregates && typeof daysOnMarketAggregates === 'object') {
      console.log('[getCityRankings] Processing daysOnMarket aggregates, found cities:', Object.keys(daysOnMarketAggregates).length);
      Object.keys(daysOnMarketAggregates).forEach((city) => {
        const cityData = daysOnMarketAggregates[city];
        if (!cityDataMap.has(city)) {
          cityDataMap.set(city, { city });
        }
        const data = cityDataMap.get(city)!;
        data.daysOnMarket = Math.round(cityData?.avg || 0);
        // closedCount is set from closedAggregates, not from daysOnMarket
      });
    } else {
      console.warn('[getCityRankings] No daysOnMarket aggregates found in current stats response');
    }

    // Process closed aggregates (if available separately)
    // Note: closed aggregates structure is { "Toronto": 6791, "Ottawa": 2472, ... } - just numbers
    if (closedAggregates && typeof closedAggregates === 'object') {
      console.log('[getCityRankings] Processing closed aggregates, found cities:', Object.keys(closedAggregates).length);
      Object.keys(closedAggregates).forEach((city) => {
        const closedCount = closedAggregates[city];
        if (!cityDataMap.has(city)) {
          cityDataMap.set(city, { city });
        }
        const data = cityDataMap.get(city)!;
        // Update closed count (closed aggregates are just numbers, not objects)
        if (typeof closedCount === 'number' && closedCount > 0) {
          data.closedCount = closedCount;
        }
      });
    }

    // Process new listings and closed count for last 28 days (for turnover calculation)
    // Fetched separately since aggregation isn't supported for cnt-new
    newListingsCountsMap.forEach((newCount, city) => {
      if (!cityDataMap.has(city)) {
        cityDataMap.set(city, { city });
      }
      
      const data = cityDataMap.get(city)!;
      data.newListingsCount = newCount;
      // Override closedCount with 28-day count for turnover calculation
      if (closedCounts28DaysMap.has(city)) {
        data.closedCount28Days = closedCounts28DaysMap.get(city)!;
      }
    });

    // Process historical stats (avg-soldPrice)
    // Based on API response structure: statistics.soldPrice.aggregates.address.city
    // Type assertion needed because aggregates is Record<string, unknown>
    const historicalSoldPriceAggregates = (historicalStatsResponse?.statistics?.soldPrice?.aggregates as { address?: { city?: Record<string, { avg?: number; med?: number }> } })?.address?.city;

    if (historicalSoldPriceAggregates && typeof historicalSoldPriceAggregates === 'object') {
      console.log('[getCityRankings] Processing historical soldPrice aggregates, found cities:', Object.keys(historicalSoldPriceAggregates).length);
      Object.keys(historicalSoldPriceAggregates).forEach((city) => {
        const cityData = historicalSoldPriceAggregates[city];
        const historicalAvgPrice = cityData?.avg || 0;
        
        if (!cityDataMap.has(city)) {
          cityDataMap.set(city, { city });
        }
        
        const data = cityDataMap.get(city)!;
        data.historicalAvgPrice = Math.round(historicalAvgPrice);
      });
    } else {
      console.warn('[getCityRankings] No historical aggregates found in historical stats response');
    }

    // Convert map to array and calculate derived metrics
    const cityDataArray: CityRankingData[] = Array.from(cityDataMap.values())
      .map((data) => {
        const currentAvgPrice = data.averagePrice || 0;
        const historicalAvgPrice = data.historicalAvgPrice || 0;
        // Use 28-day closed count for turnover, fallback to 3-month count if not available
        const closedCount28Days = data.closedCount28Days ?? data.closedCount ?? 0;
        const newListingsCount = data.newListingsCount || 1;

        // Calculate price growth (year-over-year)
        // Validate to prevent extreme percentages from data errors
        let priceGrowth = 0;
        if (historicalAvgPrice > 0 && currentAvgPrice > 0) {
          const growth = ((currentAvgPrice - historicalAvgPrice) / historicalAvgPrice) * 100;
          // Cap at reasonable values (e.g., -90% to +500%) to filter out data errors
          // If historical price is very small (< 1000), it might be a data issue
          if (historicalAvgPrice >= 1000 && growth >= -90 && growth <= 500) {
            priceGrowth = growth;
          }
        }

        // Calculate turnover (homes sold in last 28 days / listings added in last 28 days * 100)
        // Cap at 1000% to filter out data errors (e.g., if new listings is 0 or very small)
        let turnover = 0;
        if (newListingsCount > 0 && closedCount28Days >= 0) {
          const turnoverValue = (closedCount28Days / newListingsCount) * 100;
          // Cap at 1000% - if turnover is higher, likely a data issue
          turnover = turnoverValue <= 1000 ? turnoverValue : 0;
        }

        return {
          city: data.city!,
          averagePrice: currentAvgPrice,
          medianPrice: data.medianPrice || 0,
          priceGrowth: parseFloat(priceGrowth.toFixed(1)),
          daysOnMarket: data.daysOnMarket || 0,
          turnover: parseFloat(turnover.toFixed(1)),
        } as CityRankingData;
      })
      .filter((data) => data.averagePrice > 0); // Filter out cities with no data
    
    // Filter out cities with no data or null results
    const validCityData = cityDataArray.filter((data): data is CityRankingData => 
      data !== null && data.averagePrice > 0
    );

    // Clean the current city name for comparison (remove "Real Estate" suffix, etc.)
    const cleanCurrentCityName = currentCityName
      .replace(/\s+Real\s+Estate$/i, '')
      .replace(/\s+RE$/i, '')
      .trim()
      .toLowerCase();

    // Helper function to check if a city matches the current city
    const isCurrentCity = (city: string): boolean => {
      const cleanCity = city
        .replace(/\s+Real\s+Estate$/i, '')
        .replace(/\s+RE$/i, '')
        .trim()
        .toLowerCase();
      return cleanCity === cleanCurrentCityName;
    };

    // Sort and rank by price (descending)
    const priceData = [...validCityData]
      .sort((a, b) => b.averagePrice - a.averagePrice)
      .map((data, index) => ({
        rank: index + 1,
        city: data.city,
        averagePrice: data.averagePrice,
        medianPrice: data.medianPrice,
        isCurrentCity: isCurrentCity(data.city),
      }));

    // Sort and rank by growth (descending)
    const growthData = [...validCityData]
      .sort((a, b) => b.priceGrowth - a.priceGrowth)
      .map((data, index) => ({
        rank: index + 1,
        city: data.city,
        priceGrowth: data.priceGrowth,
        isCurrentCity: isCurrentCity(data.city),
      }));

    // Sort and rank by days on market (ascending - lower is better)
    const daysOnMarketData = [...validCityData]
      .sort((a, b) => a.daysOnMarket - b.daysOnMarket)
      .map((data, index) => ({
        rank: index + 1,
        city: data.city,
        daysOnMarket: data.daysOnMarket,
        isCurrentCity: isCurrentCity(data.city),
      }));

    // Sort and rank by turnover (descending)
    const turnoverData = [...validCityData]
      .sort((a, b) => b.turnover - a.turnover)
      .map((data, index) => ({
        rank: index + 1,
        city: data.city,
        turnover: data.turnover,
        isCurrentCity: isCurrentCity(data.city),
      }));

    // Find current city's ranks (findIndex returns -1 if not found, so we add 1 and check if > 0)
    const currentCityPriceIndex = priceData.findIndex(d => d.isCurrentCity);
    const currentCityGrowthIndex = growthData.findIndex(d => d.isCurrentCity);
    const currentCityDaysIndex = daysOnMarketData.findIndex(d => d.isCurrentCity);
    const currentCityTurnoverIndex = turnoverData.findIndex(d => d.isCurrentCity);
    
    const currentCityPriceRank = currentCityPriceIndex >= 0 ? currentCityPriceIndex + 1 : 0;
    const currentCityGrowthRank = currentCityGrowthIndex >= 0 ? currentCityGrowthIndex + 1 : 0;
    const currentCityDaysRank = currentCityDaysIndex >= 0 ? currentCityDaysIndex + 1 : 0;
    const currentCityTurnoverRank = currentCityTurnoverIndex >= 0 ? currentCityTurnoverIndex + 1 : 0;

    // Validate that we have at least some valid city data
    if (validCityData.length === 0) {
      console.error('[getCityRankings] No valid city data found after processing aggregates');
      return null;
    }

    // Validate that we have valid ranking arrays
    if (priceData.length === 0 || growthData.length === 0 || daysOnMarketData.length === 0 || turnoverData.length === 0) {
      console.error('[getCityRankings] Empty ranking arrays - not returning data');
      return null;
    }

    // Debug logging
    console.log(`[getCityRankings] Current city: ${currentCityName}`);
    console.log(`[getCityRankings] Valid cities with data: ${validCityData.length}`);
    console.log(`[getCityRankings] City data sample:`, validCityData.slice(0, 3).map(d => ({ city: d.city, price: d.averagePrice })));
    console.log(`[getCityRankings] Current city found in rankings:`, {
      price: currentCityPriceIndex >= 0,
      growth: currentCityGrowthIndex >= 0,
      days: currentCityDaysIndex >= 0,
      turnover: currentCityTurnoverIndex >= 0,
    });
    console.log(`[getCityRankings] Calculated ranks:`, {
      mostExpensive: currentCityPriceRank,
      fastestGrowing: currentCityGrowthRank,
      fastestSelling: currentCityDaysRank,
      highestTurnover: currentCityTurnoverRank,
    });

    const overview: RankingOverviewData = {
      mostExpensive: currentCityPriceRank,
      fastestGrowing: currentCityGrowthRank,
      fastestSelling: currentCityDaysRank,
      highestTurnover: currentCityTurnoverRank,
    };

    // Note: overview is no longer returned - it's calculated dynamically per city in the API route
    // This allows the same rankings data to be used for all cities without storing city-specific overview
    return {
      rankings: {
        price: priceData,
        growth: growthData,
        daysOnMarket: daysOnMarketData,
        turnover: turnoverData,
      },
      overview: null, // Overview is calculated dynamically per city
    };
  } catch (error) {
    console.error('[getCityRankings] Exception:', error);
    return null;
  }
}

export interface DaysOnMarketData {
  months: string[];
  lastYear: number[];
  currentYear: number[];
}

export async function getDaysOnMarketData(params: AnalyticsParams): Promise<DaysOnMarketData | null> {
  const now = new Date();
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
  
  const locationParams: LocationParams = {
    city: params.city,
    neighborhood: params.neighborhood,
    area: params.area,
    latitude: params.latitude,
    longitude: params.longitude,
    radiusKm: params.radiusKm,
  };

  const [currentYearResponse, lastYearResponse] = await Promise.all([
    getStatistics(AnalyticsBuilders.daysOnMarket.average({
      location: locationParams,
      dateRange: {
        start: currentYearStart.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
      grouping: 'grp-mth',
      additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
    })),
    getStatistics(AnalyticsBuilders.daysOnMarket.average({
      location: locationParams,
      dateRange: {
        start: lastYearStart.toISOString().split('T')[0],
        end: lastYearEnd.toISOString().split('T')[0],
      },
      grouping: 'grp-mth',
      additionalFilters: params.propertyClass ? { class: params.propertyClass } : {},
    })),
  ]);

  const months: string[] = [];
  const lastYear: number[] = [];
  const currentYear: number[] = [];

  const currentYearMth = currentYearResponse?.statistics?.daysOnMarket?.mth || {};
  const lastYearMth = lastYearResponse?.statistics?.daysOnMarket?.mth || {};
  
  // Get all months from both years
  const allMonths = [...new Set([...Object.keys(currentYearMth), ...Object.keys(lastYearMth)])].sort();

  allMonths.forEach((month) => {
    const date = new Date(month + '-01');
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    months.push(monthLabel);
    
    const currentYearValue = currentYearMth[month]?.avg || 0;
    const lastYearValue = lastYearMth[month]?.avg || 0;
    
    currentYear.push(Math.round(currentYearValue));
    lastYear.push(Math.round(lastYearValue));
  });

  return { months, lastYear, currentYear };
}
