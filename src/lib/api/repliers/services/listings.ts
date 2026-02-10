/**
 * Listings Service
 * 
 * Handles all listing-related API calls:
 * - Fetching listings with filters
 * - Property details
 * - Similar listings
 * - Image URL transformation
 */

import { repliersClient, API_CONFIG } from '../client';
import type { PropertyListing, ApiListing, ListingsResponse } from '@/lib/types';
import type { SinglePropertyListingResponse } from '../types/single-listing';

// ============================================================================
// TYPES
// ============================================================================

export interface ListingsParams {
  page?: number;
  resultsPerPage?: number;
  class?: string;
  propertyType?: string;
  type?: string; // "Sale" or "Lease" for listing type
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBaths?: number; // Use minBaths instead of minBathrooms
  maxBaths?: number; // Use maxBaths instead of maxBathrooms
  minBathrooms?: number; // Keep for backward compatibility
  maxBathrooms?: number; // Keep for backward compatibility
  minSqft?: number;
  maxSqft?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  yearBuilt?: string; // For age ranges like "0-5"
  minListDate?: string; // Format: YYYY-MM-DD
  maxListDate?: string; // Format: YYYY-MM-DD
  minOpenHouseDate?: string; // Format: YYYY-MM-DD - listings with open house on or after this date
  maxOpenHouseDate?: string; // Format: YYYY-MM-DD - listings with open house on or before this date
  city?: string;
  status?: string | string[];
  lastStatus?: string | string[];
  search?: string;
  searchFields?: string;
  minGarageSpaces?: number;
  minParkingSpaces?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface ListingsResult {
  listings: PropertyListing[];
  count: number;
  numPages: number;
}

// ============================================================================
// CLUSTER TYPES (Server-side clustering)
// ============================================================================

export interface ClusterLocation {
  latitude: number;
  longitude: number;
}

export interface ClusterBounds {
  bottom_right: ClusterLocation;
  top_left: ClusterLocation;
}

export interface ClusterListing {
  mlsNumber?: string;
  listPrice?: string | number;
  address?: {
    city?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Cluster {
  count: number;
  location: ClusterLocation;
  bounds: ClusterBounds;
  map: number[][][]; // Polygon coordinates
  listing?: ClusterListing; // Present when count === 1
  listings?: ClusterListing[]; // Present when count <= clusterListingsThreshold
  statistics?: {
    [key: string]: {
      avg?: number;
      [key: string]: unknown;
    };
  };
}

export interface ClustersResponse {
  aggregates?: {
    map?: {
      clusters?: Cluster[];
    };
  };
  listings?: ApiListing[];
  count?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ClusterParams extends Omit<ListingsParams, 'page' | 'resultsPerPage'> {
  // Map bounds - can be GeoJSON polygon array or MapBounds object
  map?: string | number[][][] | MapBounds;
  // Cluster parameters
  cluster?: boolean;
  clusterPrecision?: number; // 1-29, typically matches zoom level
  clusterLimit?: number; // 1-200
  clusterFields?: string; // Comma-separated fields for single-listing clusters
  clusterListingsThreshold?: number; // Include listings array for clusters <= this count
  clusterStatistics?: boolean;
  // For map-only view, set listings to false
  listings?: boolean;
}

export interface ClustersResult {
  clusters: Cluster[];
  listings: PropertyListing[]; // Individual listings (if requested)
  count: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format map bounds for Repliers API.
 *
 * IMPORTANT: Repliers expects the `map` query param as a *single string* that looks like:
 * `[[[lng,lat],[lng,lat],[lng,lat],[lng,lat],[lng,lat]]]`
 * (coordinates are in [longitude, latitude] format)
 */
export function formatMapBounds(bounds: MapBounds): string {
  const ring: Array<[number, number]> = [
    [bounds.east, bounds.north], // NE
    [bounds.west, bounds.north], // NW
    [bounds.west, bounds.south], // SW
    [bounds.east, bounds.south], // SE
    [bounds.east, bounds.north], // close
  ];

  return `[[${ring.map(([lng, lat]) => `[${lng},${lat}]`).join(',')}]]`;
}

/**
 * Transform CDN image URLs
 */
export function transformImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('sandbox/')) {
    return `${API_CONFIG.cdnUrl}/${imagePath}`;
  }
  
  return `${API_CONFIG.cdnUrl}/${imagePath}`;
}

/**
 * Get image array with fallbacks
 */
function getImages(listing: ApiListing): string[] {
  let images: string[] = [];
  
  if (listing.images && Array.isArray(listing.images)) {
    images = listing.images
      .map(transformImageUrl)
      .filter(url => url);
  }
  
  // Fallback images
  if (images.length === 0) {
    images = [
      '/images/p1.jpg',
      '/images/p2.jpg',
      '/images/p3.jpg',
      '/images/p4.jpg',
      '/images/p5.jpg',
    ];
  }
  
  return images;
}

/**
 * Format location string according to Canadian address standards
 * Returns a two-line format: "Street Address\nArea, City, Province Postal Code"
 */
function formatLocation(listing: ApiListing): string {
  const addr = listing.address;
  if (!addr) return 'Location not available';

  // Build street address (Line 1): Unit Number (if exists), Street Number + Street Name + Street Suffix
  const streetParts = [];
  if (addr.unitNumber) streetParts.push(addr.unitNumber);
  if (addr.streetNumber) streetParts.push(addr.streetNumber);
  if (addr.streetName) streetParts.push(addr.streetName);
  if (addr.streetSuffix) streetParts.push(addr.streetSuffix);
  if (addr.streetDirection) streetParts.push(addr.streetDirection);
  
  const streetAddress = streetParts.length > 0 ? streetParts.join(' ') : '';

  // Build city line (Line 2) - Canadian format: "Area, City, Province Postal Code"
  // Include area if available (e.g., "Parry Sound, The Archipelago, ON P0G 1K0")
  const cityParts = [];
  if (addr.area) cityParts.push(addr.area);
  if (addr.city) cityParts.push(addr.city);
  if (addr.state) cityParts.push(addr.state);
  if (addr.zip) cityParts.push(addr.zip);

  const cityLine = cityParts.length > 0 ? cityParts.join(' ') : '';

  // Combine with newline for two-line format
  if (streetAddress && cityLine) {
    return `${streetAddress}\n${cityLine}`;
  } else if (streetAddress) {
    return streetAddress;
  } else if (cityLine) {
    return cityLine;
  }

  // Fallback: include neighborhood if available
  const fallbackParts = [
    addr.neighborhood,
    addr.area,
    addr.city,
    addr.state,
    addr.zip,
  ].filter(Boolean);
  
  return fallbackParts.length > 0 ? fallbackParts.join(' ') : 'Location not available';
}

/**
 * Convert status code to readable status text
 * Uses standardStatus (RESO-compliant) if available, otherwise maps A/U to readable terms
 */
function getReadableStatus(listing: ApiListing): string {
  // Prefer standardStatus (RESO-compliant) if available
  if (listing.standardStatus) {
    return listing.standardStatus;
  }
  
  // Map legacy status codes to readable terms
  const status = listing.status?.toUpperCase();
  const lastStatus = listing.lastStatus?.toLowerCase();
  
  if (status === 'A') {
    // Available (On-Market) - map lastStatus to more specific terms
    if (lastStatus) {
      const lastStatusMap: Record<string, string> = {
        'new': 'Active',
        'sc': 'Active Under Contract',
        'pc': 'Active Under Contract',
        'sld': 'Closed',
        'exp': 'Expired',
        'wth': 'Withdrawn',
        'can': 'Canceled',
        'hold': 'Hold',
        'inc': 'Incomplete',
      };
      return lastStatusMap[lastStatus] || 'Active';
    }
    return 'Active';
  }
  
  if (status === 'U') {
    // Unavailable (Off-Market) - map lastStatus to more specific terms
    if (lastStatus) {
      const lastStatusMap: Record<string, string> = {
        'sld': 'Closed',
        'exp': 'Expired',
        'wth': 'Withdrawn',
        'can': 'Canceled',
        'hold': 'Hold',
        'pc': 'Pending',
        'sc': 'Pending',
      };
      return lastStatusMap[lastStatus] || 'Unavailable';
    }
    return 'Unavailable';
  }
  
  // Fallback
  return listing.status || 'Active';
}

/**
 * Transform API listing to PropertyListing
 */
export function transformListing(listing: ApiListing): PropertyListing {
  const images = getImages(listing);
  const location = formatLocation(listing);
  const readableStatus = getReadableStatus(listing);
  
  return {
    mlsNumber: listing.mlsNumber || '',
    status: readableStatus,
    class: listing.class || 'residential',
    type: typeof listing.type === 'string' ? listing.type : 'Sale',
    listPrice: listing.listPrice || 0,
    listDate: listing.listDate || new Date().toISOString(),
    lastStatus: listing.lastStatus || '',
    soldPrice: typeof listing.soldPrice === 'string' ? listing.soldPrice : (listing.soldPrice ? String(listing.soldPrice) : ''),
    soldDate: listing.soldDate || '',
    daysOnMarket: listing.daysOnMarket ?? listing.simpleDaysOnMarket ?? undefined,
    originalPrice: listing.originalPrice || undefined,
    
    address: {
      area: listing.address?.area || null,
      city: listing.address?.city || null,
      country: listing.address?.country || null,
      district: listing.address?.district || null,
      majorIntersection: listing.address?.majorIntersection || null,
      neighborhood: listing.address?.neighborhood || null,
      streetDirection: listing.address?.streetDirection || null,
      streetName: listing.address?.streetName || null,
      streetNumber: listing.address?.streetNumber || null,
      streetSuffix: listing.address?.streetSuffix || null,
      unitNumber: listing.address?.unitNumber || null,
      zip: listing.address?.zip || null,
      state: listing.address?.state || null,
      communityCode: listing.address?.communityCode || null,
      streetDirectionPrefix: listing.address?.streetDirectionPrefix || null,
      addressKey: listing.address?.addressKey || null,
      location,
    },
    
    map: {
      latitude: listing.map?.latitude || null,
      longitude: listing.map?.longitude || null,
      point: listing.map?.point || null,
    },
    
    details: {
      numBathrooms: listing.details?.numBathrooms || 0,
      numBathroomsPlus: listing.details?.numBathroomsPlus || 0,
      numBedrooms: listing.details?.numBedrooms || 0,
      numBedroomsPlus: listing.details?.numBedroomsPlus || 0,
      propertyType: listing.details?.propertyType || 'Unknown',
      sqft: listing.details?.sqft || 0,
      description: listing.details?.description || null,
      yearBuilt: listing.details?.yearBuilt || null,
      garage: listing.details?.garage || null,
      numGarageSpaces: listing.details?.numGarageSpaces || null,
    },
    
    updatedOn: listing.updatedOn || new Date().toISOString(),
    
    lot: {
      acres: listing.lot?.acres || 0,
      depth: listing.lot?.depth || 0,
      irregular: listing.lot?.irregular || 0,
      legalDescription: listing.lot?.legalDescription || '',
      measurement: listing.lot?.measurement || '',
      width: listing.lot?.width || 0,
      size: typeof listing.lot?.size === 'string' ? parseFloat(listing.lot?.size) : (listing.lot?.size ? Number(listing.lot?.size) : 0),
      source: listing.lot?.source || '',
      dimensionsSource: listing.lot?.dimensionsSource || '',
      dimensions: listing.lot?.dimensions || '',
      squareFeet: listing.lot?.squareFeet || 0,
      features: listing.lot?.features || '',
      taxLot: listing.lot?.taxLot || 0,
    },
    
    boardId: listing.boardId && listing.boardId > 0 ? listing.boardId : 0,
    
    images: {
      imageUrl: images[0] || '',
      allImages: images,
    },
    openHouse: listing.openHouse || undefined,
    condominium: listing.condominium || undefined,
  };
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Fetch all listings (default view)
 */
export async function fetchListings(): Promise<PropertyListing[]> {
  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.listings,
    priority: 'normal',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch listings:', response.error?.message);
    return [];
  }

  return response.data.listings.map(transformListing);
}

/**
 * Fetch listings with filters and pagination
 */
export async function getListings(params: ListingsParams): Promise<ListingsResult> {
  console.log('🔍 [Listings Service] Fetching listings with params:', params);
  
  // Normalize map param to Repliers string format (critical for proper bounds filtering)
  const apiParams: Record<string, unknown> = { ...params };
  if (apiParams.map) {
    if (typeof apiParams.map === 'string') {
      // already correct
    } else if (typeof apiParams.map === 'object' && apiParams.map !== null && 'west' in (apiParams.map as object)) {
      apiParams.map = formatMapBounds(apiParams.map as MapBounds);
    } else if (Array.isArray(apiParams.map)) {
      // Back-compat: nested ring array -> string
      const ring = (apiParams.map as unknown as number[][][])[0] as unknown as Array<[number, number]>;
      apiParams.map = `[[${ring.map(([lng, lat]) => `[${lng},${lat}]`).join(',')}]]`;
    }
  }

  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    params: apiParams,
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.listings,
    priority: 'high',
  });

  if (response.error || !response.data) {
    console.error('❌ [Listings Service] Failed to fetch filtered listings:', {
      error: response.error?.message,
      code: response.error?.code,
    });
    return { listings: [], count: 0, numPages: 0 };
  }

  const transformedListings = response.data.listings.map(transformListing);

  console.log('✅ [Listings Service] Successfully fetched listings:', {
    totalFromAPI: response.data.count || response.data.listings.length,
    transformed: transformedListings.length,
    params: params,
  });

  return {
    listings: transformedListings,
    count: response.data.count || transformedListings.length,
    numPages: response.data.numPages || Math.ceil(transformedListings.length / (params.resultsPerPage || 10)),
  };
}

/**
 * Autocomplete search for listings (Repliers docs: search by address, MLS, city).
 * Used with locations/autocomplete for combined autocomplete UI.
 */
const AUTOCOMPLETE_LISTINGS_FIELDS =
  'address.*,mlsNumber,boardId,listPrice,details.numBedrooms,details.numBedroomsPlus,details.numBathrooms,details.numBathroomsPlus,details.numGarageSpaces,details.propertyType,type,lastStatus,images';
const AUTOCOMPLETE_LISTINGS_SEARCH_FIELDS =
  'address.streetNumber,address.streetName,mlsNumber,address.city';

export async function searchListingsAutocomplete(params: {
  search: string;
  resultsPerPage?: number;
}): Promise<ListingsResult> {
  const { search, resultsPerPage = 10 } = params;
  const trimmed = search?.trim() || '';
  if (trimmed.length < 3) {
    return { listings: [], count: 0, numPages: 0 };
  }

  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    params: {
      search: trimmed,
      searchFields: AUTOCOMPLETE_LISTINGS_SEARCH_FIELDS,
      fields: AUTOCOMPLETE_LISTINGS_FIELDS,
      status: ['A', 'U'],
      fuzzysearch: true,
      resultsPerPage,
    },
    authMethod: 'header',
    cache: true,
    cacheDuration: 60 * 1000, // 1 min for autocomplete
    priority: 'high',
  });

  if (response.error || !response.data) {
    return { listings: [], count: 0, numPages: 0 };
  }

  const listings = (response.data.listings || []).map(transformListing);
  const count = response.data.count ?? listings.length;
  return {
    listings,
    count,
    numPages: Math.ceil(count / resultsPerPage) || 1,
  };
}

/**
 * Fetch similar listings
 */
export async function getSimilarListings(params: {
  class?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  limit?: number;
  excludeMlsNumber?: string;
}): Promise<PropertyListing[]> {
  const { excludeMlsNumber, limit = 10, ...searchParams } = params;

  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    params: {
      ...searchParams,
      resultsPerPage: limit + 5, // Fetch extra in case we need to filter
      status: 'A',
    },
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.listings,
    priority: 'normal',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch similar listings:', response.error?.message);
    return [];
  }

  let listings = response.data.listings.map(transformListing);

  // Exclude current listing
  if (excludeMlsNumber) {
    listings = listings.filter(l => l.mlsNumber !== excludeMlsNumber);
  }

  return listings.slice(0, limit);
}

/**
 * Helper function to get boardId for a listing by searching for it first
 */
async function getBoardIdForListing(mlsNumber: string): Promise<number | null> {
  const trySearch = async (params: Record<string, unknown>): Promise<number | null> => {
    const searchResult = await repliersClient.request<ListingsResponse>({
      endpoint: '/listings',
      params: { resultsPerPage: 10, ...params },
      authMethod: 'header',
      cache: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      priority: 'high',
    });
    if (searchResult.error || !searchResult.data?.listings?.length) return null;
    const listing = searchResult.data.listings.find((l) => l.mlsNumber === mlsNumber);
    return listing?.boardId && listing.boardId > 0 ? listing.boardId : null;
  };

  try {
    console.log('[Repliers API] Searching for listing to get boardId:', mlsNumber);

    // 1) Try filter by mlsNumber if the API supports it
    let boardId = await trySearch({ mlsNumber });
    if (boardId != null) {
      console.log('[Repliers API] Found boardId:', boardId, 'for listing:', mlsNumber);
      return boardId;
    }

    // 2) Fallback: free-text search (e.g. user pasted MLS number; search by MLS)
    boardId = await trySearch({
      search: mlsNumber,
      searchFields: 'mlsNumber',
      fields: 'mlsNumber,boardId',
    });
    if (boardId != null) {
      console.log('[Repliers API] Found boardId via search:', boardId, 'for listing:', mlsNumber);
      return boardId;
    }

    console.warn('[Repliers API] Could not find boardId for listing:', mlsNumber);
    return null;
  } catch (error) {
    console.error('[Repliers API] Exception getting boardId for listing:', mlsNumber, error);
    return null;
  }
}

/**
 * Fetch listing details by MLS number and boardId
 * Returns the full API response structure for a single property listing
 * If boardId is not provided, it will be fetched automatically
 */
export async function getListingDetails(mlsNumber: string, boardId?: number): Promise<PropertyListing | null> {
  // Repliers API rejects boardId 0 – treat 0 as missing so we try without boardId or look it up
  let finalBoardId: number | undefined =
    boardId != null && boardId > 0 ? boardId : undefined;
  try {
    // If boardId is not provided, try to get it by searching for the listing
    if (finalBoardId === undefined) {
      console.log('[Repliers API] BoardId not provided, searching for listing to get boardId...');
      const foundBoardId = await getBoardIdForListing(mlsNumber);
      finalBoardId = foundBoardId ?? undefined;
      
      if (finalBoardId === undefined) {
        console.error('[Repliers API] Could not determine boardId for listing:', mlsNumber);
        // Try without boardId as fallback
        console.log('[Repliers API] Attempting to fetch without boardId as fallback...');
      } else {
        console.log('[Repliers API] Found boardId:', finalBoardId, 'for listing:', mlsNumber);
      }
    }
    
    console.log('[Repliers API] Requesting listing:', { mlsNumber, boardId: finalBoardId });
    
    const params: Record<string, string | number> = {};
    if (finalBoardId != null && finalBoardId > 0) {
      params.boardId = finalBoardId;
    }
    
    const response = await repliersClient.request<SinglePropertyListingResponse | ApiListing>({
      endpoint: `/listings/${mlsNumber}`,
      params,
      authMethod: 'header',
      cache: true,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
      priority: 'high',
    });

    console.log('[Repliers API] Response received:', {
      mlsNumber,
      boardId: finalBoardId,
      hasError: !!response.error,
      hasData: !!response.data,
      cached: response.cached,
      error: response.error,
    });

    if (response.error) {
      console.error('[Repliers API] API returned error:', {
        mlsNumber,
        boardId: finalBoardId,
        errorCode: response.error.code,
        errorMessage: response.error.message,
        retryable: response.error.retryable,
      });
      return null;
    }

    if (!response.data) {
      console.error('[Repliers API] No data in response:', {
        mlsNumber,
        boardId: finalBoardId,
        response,
      });
      return null;
    }

    console.log('[Repliers API] Transforming listing data for:', {
      mlsNumber,
      boardId: finalBoardId,
    });
    const transformed = transformListing(response.data as ApiListing);
    console.log('[Repliers API] Listing transformed successfully:', {
      mlsNumber: transformed.mlsNumber,
      boardId: transformed.boardId,
      address: transformed.address?.location,
    });
    
    return transformed;
    } catch (error) {
      // Handle both Error objects and ApiResponse objects that might be thrown
      let errorDetails: { error?: string; data?: unknown } | Error | unknown;
      
      if (error && typeof error === 'object' && 'error' in error && 'data' in error) {
        // This is an ApiResponse object that was thrown
        const apiResponse = error as { error: { code: string; message: string } | null; data: unknown };
        errorDetails = {
          type: 'ApiResponse',
          errorCode: apiResponse.error?.code,
          errorMessage: apiResponse.error?.message,
          hasData: !!apiResponse.data,
        };
      } else if (error instanceof Error) {
        errorDetails = {
          type: 'Error',
          message: error.message,
          name: error.name,
          stack: error.stack,
        };
      } else {
        errorDetails = {
          type: typeof error,
          value: error,
        };
      }
      
      console.error('[Repliers API] Exception fetching listing details:', {
        mlsNumber,
        boardId: finalBoardId,
        error: errorDetails,
      });
      
      // Return null instead of throwing to prevent unhandled promise rejection
      return null;
    }
}

/**
 * Fetch raw listing details by MLS number and boardId
 * Returns the complete API response without transformation
 * If boardId is not provided, it will be fetched automatically
 */
export async function getRawListingDetails(mlsNumber: string, boardId?: number): Promise<SinglePropertyListingResponse | null> {
  // Repliers API rejects boardId 0 – treat 0 as missing
  let finalBoardId: number | undefined =
    boardId != null && boardId > 0 ? boardId : undefined;
  try {
    // If boardId is not provided, try to get it by searching for the listing
    if (finalBoardId === undefined) {
      const foundBoardId = await getBoardIdForListing(mlsNumber);
      finalBoardId = foundBoardId ?? undefined;
    }
    
    const params: Record<string, string | number> = {};
    if (finalBoardId != null && finalBoardId > 0) {
      params.boardId = finalBoardId;
    }
    
    const response = await repliersClient.request<SinglePropertyListingResponse>({
      endpoint: `/listings/${mlsNumber}`,
      params,
      authMethod: 'header',
      cache: true,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
      priority: 'high',
    });

    if (response.error || !response.data) {
      console.error('[Repliers API] Failed to fetch raw listing details:', {
        mlsNumber,
        boardId: finalBoardId,
        error: response.error,
        hasData: !!response.data,
      });
      return null;
    }

    console.log('[Repliers API] Raw listing fetched successfully:', {
      mlsNumber,
      boardId: finalBoardId,
    });

    return response.data;
  } catch (error) {
    console.error('[Repliers API] Exception fetching raw listing details:', {
      mlsNumber,
      boardId: finalBoardId,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : {
        type: typeof error,
        value: error,
      },
    });
    // Return null instead of throwing to prevent unhandled promise rejection
    return null;
  }
}

/**
 * Fetch clusters with map bounds and zoom-based precision
 * This is the recommended approach for map views - uses server-side clustering
 * 
 * @param params - Cluster parameters including map bounds and zoom
 * @returns Clusters and optionally individual listings
 */
export async function getClusters(params: ClusterParams): Promise<ClustersResult> {
  console.log('🗺️ [Clusters Service] Fetching clusters with params:', {
    ...params,
    map: params.map ? '***' : undefined, // Don't log full bounds
  });
  
  // Build API parameters - clusters come from aggregates.map.clusters
  // (Without aggregates=map the API may not return map clusters.)
  const apiParams: Record<string, unknown> = { cluster: true, listings: false, aggregates: 'map' };
  
  // Normalize map param to Repliers string format
  if (params.map) {
    if (typeof params.map === 'string') {
      apiParams.map = params.map;
    } else if (Array.isArray(params.map)) {
      const ring = (params.map as number[][][])[0] as unknown as Array<[number, number]>;
      apiParams.map = `[[${ring.map(([lng, lat]) => `[${lng},${lat}]`).join(',')}]]`;
    } else if (typeof params.map === 'object' && 'west' in params.map) {
      apiParams.map = formatMapBounds(params.map as MapBounds);
    }
  }

  // Pass-through all provided filters/params (except map and cluster toggles)
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'map' || key === 'cluster' || key === 'listings') return;

    if (key === 'clusterPrecision') {
      apiParams.clusterPrecision = Math.max(1, Math.min(29, Math.round(Number(value))));
      return;
    }

    // Repliers supports this; we previously forgot to actually send it
    if (key === 'clusterLimit') {
      apiParams.clusterLimit = Number(value);
      return;
    }

    // Other cluster-specific options (pass-through as-is)
    if (
      key === 'clusterFields' ||
      key === 'clusterListingsThreshold' ||
      key === 'clusterStatistics'
    ) {
      apiParams[key] = value;
      return;
    }

    // Everything else is treated as a normal listing filter (status, lastStatus, city, neighborhood, type, etc.)
    apiParams[key] = value;
  });
  
  // Log the exact parameters being sent (for debugging)
  console.log('🔍 [Clusters Service] API Request Details:', {
    endpoint: '/listings',
    paramCount: Object.keys(apiParams).length,
    hasMap: !!apiParams.map,
    hasCluster: !!apiParams.cluster,
    clusterPrecision: apiParams.clusterPrecision,
    clusterLimit: apiParams.clusterLimit,
    listings: apiParams.listings,
    // Don't log full params to avoid console spam
  });

  const response = await repliersClient.request<ClustersResponse>({
    endpoint: '/listings',
    params: apiParams,
    authMethod: 'header',
    cache: false, // Don't cache clusters - they change with map position
    priority: 'high',
  });

  if (response.error || !response.data) {
    console.error('❌ [Clusters Service] Failed to fetch clusters:', {
      error: response.error,
      errorMessage: response.error?.message,
      errorCode: response.error?.code,
      errorStatus: response.error?.status,
      hasData: !!response.data,
      params: {
        ...apiParams,
        map: apiParams.map ? '***' : undefined, // Don't log full bounds
      },
    });
    return { clusters: [], listings: [], count: 0 };
  }

  const clusters = response.data.aggregates?.map?.clusters || [];
  const listings = response.data.listings 
    ? response.data.listings.map(transformListing)
    : [];

  console.log('✅ [Clusters Service] Successfully fetched clusters:', {
    clusterCount: clusters.length,
    listingCount: listings.length,
    totalCount: response.data.count || 0,
    clusterPrecision: apiParams.clusterPrecision,
  });

  return {
    clusters,
    listings,
    count: response.data.count || 0,
  };
}

