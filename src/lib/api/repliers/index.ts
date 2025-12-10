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
export * as LocationsService from './services/locations';

// Convenience exports
import * as ListingsService from './services/listings';
import * as PropertyTypesService from './services/property-types';
import * as CitiesService from './services/cities';
import * as AnalyticsService from './services/analytics';
import * as LocationsService from './services/locations';
import { repliersClient, API_CONFIG } from './client';

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
    getRawDetails: ListingsService.getRawListingDetails,
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

  // Locations
  locations: {
    getLocations: LocationsService.getLocations,
    getNeighborhoodsByCity: LocationsService.getNeighborhoodsByCity,
    getAreasByCity: LocationsService.getAreasByCity,
    getCitiesAndNeighborhoodsByArea: LocationsService.getCitiesAndNeighborhoodsByArea,
    getAreasByState: LocationsService.getAreasByState,
    getLocationsInRadius: LocationsService.getLocationsInRadius,
    getLocationsWithBoundaries: LocationsService.getLocationsWithBoundaries,
    autocomplete: LocationsService.autocompleteLocations,
  },

  // Analytics
  analytics: {
    // Core function
    getStatistics: AnalyticsService.getStatistics,
    // Request builders - use these to build custom requests
    builders: AnalyticsService.AnalyticsBuilders,
    // Convenience functions
    getMarketTrends: AnalyticsService.getMarketTrends,
    getListingsActivity: AnalyticsService.getListingsActivity,
    getSoldPriceTrends: AnalyticsService.getSoldPriceTrends,
    getMarketSummaryStats: AnalyticsService.getMarketSummaryStats,
    getAverageSoldPriceData: AnalyticsService.getAverageSoldPriceData,
    getAverageSoldPriceByType: AnalyticsService.getAverageSoldPriceByType,
    getSalesVolumeByType: AnalyticsService.getSalesVolumeByType,
    getPriceByBedrooms: AnalyticsService.getPriceByBedrooms,
    getPriceOverview: AnalyticsService.getPriceOverview,
    getInventoryOverview: AnalyticsService.getInventoryOverview,
    getSalesAndInventoryData: AnalyticsService.getSalesAndInventoryData,
    getDaysOnMarketData: AnalyticsService.getDaysOnMarketData,
    getNewClosedAvailableData: AnalyticsService.getNewClosedAvailableData,
    getCityRankings: AnalyticsService.getCityRankings,
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
  // Analytics - Generic Types
  StatisticsRequest,
  StatisticsResponse,
  StatisticType,
  GroupingType,
  AggregationField,
  MetricStatistics,
  GroupedStatisticValue,
  LocationParams,
  DateRangeParams,
  // Analytics - Legacy/Convenience Types
  AnalyticsParams,
  MarketData,
  ListingsActivity,
  SoldPriceData,
  MarketSummaryStats,
  AverageSoldPriceData,
  AverageSoldPriceByTypeData,
  SalesVolumeByTypeData,
  PriceByBedroomsData,
  PriceOverviewData,
  InventoryOverviewData,
  SalesAndInventoryData,
  DaysOnMarketData,
  NewClosedAvailableData,
  RankingData,
  RankingOverviewData,
  CityRankingData,
} from './services/analytics';

// Export builders for direct access
export { AnalyticsBuilders } from './services/analytics';

export type {
  // Single Property Listing
  SinglePropertyListingResponse,
  PropertyAddress,
  PropertyMap,
  PropertyPermissions,
  PropertyDetails,
  CondominiumInfo,
  CondominiumFees,
  LotInfo,
  NearbyInfo,
  OfficeInfo,
  OpenHouse,
  Room,
  TaxInfo,
  Timestamps,
  Agent,
  AgentPhoto,
  BrokerageInfo,
  BrokerageAddress,
  ListingHistory,
  ComparableListing,
  PropertyEstimate,
  EstimateHistory,
  ImageInsights,
  ImageInsightsSummary,
  ImageQualitySummary,
  QualitativeQuality,
  QuantitativeQuality,
  QualityFeatures,
  QualityFeaturesNumeric,
  ImageInsight,
  ImageClassification,
  ImageQuality,
} from './types/single-listing';

