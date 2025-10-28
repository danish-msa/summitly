/**
 * Repliers API - Main Export
 * 
 * Unified Repliers API for Summitly
 * 
 * Usage:
 * ```
 * import { RepliersAPI } from '@/lib/api/repliers';
 * 
 * const listings = await RepliersAPI.listings.fetch();
 * const cities = await RepliersAPI.cities.fetchTop();
 * const types = await RepliersAPI.propertyTypes.fetch();
 * ```
 */

// Core client
export { repliersClient, API_CONFIG } from './client';
export type { ApiResponse, ApiError, RequestConfig } from './client';

// Services
export * as ListingsService from './services/listings';
export * as PropertyTypesService from './services/property-types';
export * as CitiesService from './services/cities';
export * as AnalyticsService from './services/analytics';

// Convenience exports
import * as ListingsService from './services/listings';
import * as PropertyTypesService from './services/property-types';
import * as CitiesService from './services/cities';
import * as AnalyticsService from './services/analytics';
import { repliersClient } from './client';

/**
 * Unified API Interface
 */
export const RepliersAPI = {
  // Listings
  listings: {
    fetch: ListingsService.fetchListings,
    getFiltered: ListingsService.getListings,
    getSimilar: ListingsService.getSimilarListings,
    getDetails: ListingsService.getListingDetails,
    transformImageUrl: ListingsService.transformImageUrl,
    transformListing: ListingsService.transformListing,
  },

  // Property Types
  propertyTypes: {
    fetch: PropertyTypesService.fetchPropertyTypes,
    fetchClasses: PropertyTypesService.fetchPropertyClasses,
  },

  // Cities
  cities: {
    fetchTop: CitiesService.fetchTopCities,
  },

  // Analytics
  analytics: {
    getMarketTrends: AnalyticsService.getMarketTrends,
    getListingsActivity: AnalyticsService.getListingsActivity,
    getSoldPriceTrends: AnalyticsService.getSoldPriceTrends,
  },

  // Client utilities
  client: {
    getStats: () => repliersClient.getStats(),
    clearCache: () => repliersClient.clearCache(),
    configure: (config: Partial<typeof API_CONFIG>) => repliersClient.configure(config),
  },
};

// Type exports
export type {
  // Listings
  ListingsParams,
  ListingsResult,
} from './services/listings';

export type {
  // Analytics
  AnalyticsParams,
  MarketData,
  ListingsActivity,
  SoldPriceData,
  MarketDataResponse,
} from './services/analytics';

