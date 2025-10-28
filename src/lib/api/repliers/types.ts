/**
 * Repliers API Types
 * 
 * Centralized type definitions for all Repliers API operations
 */

// Re-export from main types file
export type {
  PropertyListing,
  ApiListing,
  ListingsResponse,
  PropertyType,
  PropertyClass,
  RepliersPropertyClass,
  PropertyTypesResponse,
  City,
} from '@/lib/types';

// API-specific types
export type {
  ApiResponse,
  ApiError,
  RequestConfig,
} from './client';

export type {
  ListingsParams,
  ListingsResult,
} from './services/listings';

export type {
  AnalyticsParams,
  MarketData,
  ListingsActivity,
  MarketDataResponse,
} from './services/analytics';

