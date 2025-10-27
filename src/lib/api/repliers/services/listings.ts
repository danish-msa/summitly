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

// ============================================================================
// TYPES
// ============================================================================

export interface ListingsParams {
  page?: number;
  resultsPerPage?: number;
  class?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  city?: string;
  status?: string | string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface ListingsResult {
  listings: PropertyListing[];
  count: number;
  numPages: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Format location string
 */
function formatLocation(listing: ApiListing): string {
  const parts = [
    listing.address?.unitNumber,
    listing.address?.streetNumber,
    listing.address?.streetName,
    listing.address?.streetSuffix,
    listing.address?.streetDirection,
    listing.address?.neighborhood,
    listing.address?.city,
    listing.address?.zip,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(' ') : 'Location not available';
}

/**
 * Transform API listing to PropertyListing
 */
export function transformListing(listing: ApiListing): PropertyListing {
  const images = getImages(listing);
  const location = formatLocation(listing);
  
  return {
    mlsNumber: listing.mlsNumber || '',
    status: listing.status || 'Active',
    class: listing.class || 'residential',
    type: typeof listing.type === 'string' ? listing.type : 'Sale',
    listPrice: listing.listPrice || 0,
    listDate: listing.listDate || new Date().toISOString(),
    lastStatus: listing.lastStatus || '',
    soldPrice: listing.soldPrice || '',
    soldDate: listing.soldDate || '',
    
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
    },
    
    updatedOn: listing.updatedOn || new Date().toISOString(),
    
    lot: {
      acres: listing.lot?.acres || 0,
      depth: listing.lot?.depth || 0,
      irregular: listing.lot?.irregular || 0,
      legalDescription: listing.lot?.legalDescription || '',
      measurement: listing.lot?.measurement || '',
      width: listing.lot?.width || 0,
      size: listing.lot?.size || 0,
      source: listing.lot?.source || '',
      dimensionsSource: listing.lot?.dimensionsSource || '',
      dimensions: listing.lot?.dimensions || '',
      squareFeet: listing.lot?.squareFeet || 0,
      features: listing.lot?.features || '',
      taxLot: listing.lot?.taxLot || 0,
    },
    
    boardId: listing.boardId || 0,
    
    images: {
      imageUrl: images[0] || '',
      allImages: images,
    },
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
  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    params,
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.listings,
    priority: 'high',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch filtered listings:', response.error?.message);
    return { listings: [], count: 0, numPages: 0 };
  }

  const transformedListings = response.data.listings.map(transformListing);

  return {
    listings: transformedListings,
    count: response.data.count || transformedListings.length,
    numPages: response.data.numPages || Math.ceil(transformedListings.length / (params.resultsPerPage || 10)),
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
 * Fetch listing details by MLS number
 */
export async function getListingDetails(mlsNumber: string): Promise<PropertyListing | null> {
  const response = await repliersClient.request<ApiListing>({
    endpoint: `/listings/${mlsNumber}`,
    authMethod: 'header',
    cache: true,
    cacheDuration: 10 * 60 * 1000, // 10 minutes
    priority: 'high',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch listing details:', response.error?.message);
    return null;
  }

  return transformListing(response.data);
}

