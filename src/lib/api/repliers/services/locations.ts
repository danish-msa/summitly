/**
 * Locations Service
 * 
 * Handles location-related data from Repliers Locations API:
 * - Areas, cities, and neighborhoods
 * - Location autocomplete/search
 * - Location filtering and pagination
 * 
 * API Documentation: https://help.repliers.com/en/article/locations-api-implementation-guide-s4c68b
 */

import { repliersClient, API_CONFIG } from '../client';

// ============================================================================
// TYPES
// ============================================================================

export interface Location {
  locationId: string;
  name: string;
  type: 'area' | 'city' | 'neighborhood';
  map?: {
    latitude: string;
    longitude: string;
    point: string;
    boundary?: number[][][];
  };
  address?: {
    state: string;
    country: string;
    city: string;
    area: string;
    neighborhood: string;
  };
}

export interface LocationsResponse {
  locations: Location[];
  count?: number;
  numPages?: number;
}

export interface LocationsParams {
  pageNum?: number;
  resultsPerPage?: number;
  type?: ('area' | 'city' | 'neighborhood')[];
  area?: string[];
  city?: string[];
  neighborhood?: string[];
  locationId?: string[];
  lat?: number;
  long?: number;
  radius?: number;
  hasBoundary?: boolean;
  fields?: string;
  map?: number[][][];
  sortBy?: 'typeasc' | 'typedesc';
  state?: string[];
}

export interface AutocompleteParams {
  search: string;
  type?: ('area' | 'city' | 'neighborhood')[];
  fields?: string;
  map?: number[][][];
  resultsPerPage?: number;
  radius?: number;
  lat?: number;
  long?: number;
  area?: string[];
  city?: string[];
  boundary?: boolean;
  hasBoundary?: boolean;
  state?: string[];
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Fetch locations with advanced filtering
 * GET /locations
 */
export async function getLocations(params: LocationsParams = {}): Promise<LocationsResponse> {
  const queryParams: Record<string, unknown> = {};
  
  if (params.pageNum) queryParams.pageNum = params.pageNum;
  if (params.resultsPerPage) queryParams.resultsPerPage = params.resultsPerPage;
  if (params.type) queryParams.type = params.type;
  if (params.area) queryParams.area = params.area;
  if (params.city) queryParams.city = params.city;
  if (params.neighborhood) queryParams.neighborhood = params.neighborhood;
  if (params.locationId) queryParams.locationId = params.locationId;
  if (params.lat !== undefined) queryParams.lat = params.lat;
  if (params.long !== undefined) queryParams.long = params.long;
  if (params.radius !== undefined) queryParams.radius = params.radius;
  if (params.hasBoundary !== undefined) queryParams.hasBoundary = params.hasBoundary;
  if (params.fields) queryParams.fields = params.fields;
  if (params.map) queryParams.map = params.map;
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.state) queryParams.state = params.state;

  const response = await repliersClient.request<LocationsResponse>({
    endpoint: '/locations',
    params: queryParams,
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.cities, // Use same cache duration as cities
    priority: 'normal',
  });

  if (response.error || !response.data) {
    console.error('Failed to fetch locations:', response.error?.message);
    return { locations: [] };
  }

  return response.data;
}

/**
 * Get all neighborhoods in a city
 */
export async function getNeighborhoodsByCity(city: string): Promise<Location[]> {
  const response = await getLocations({
    city: [city],
    type: ['neighborhood'],
  });
  return response.locations;
}

/**
 * Get all areas in a city
 */
export async function getAreasByCity(city: string): Promise<Location[]> {
  const response = await getLocations({
    city: [city],
    type: ['area'],
  });
  return response.locations;
}

/**
 * Get all cities and neighborhoods in an area
 */
export async function getCitiesAndNeighborhoodsByArea(area: string): Promise<Location[]> {
  const response = await getLocations({
    area: [area],
    type: ['city', 'neighborhood'],
  });
  return response.locations;
}

/**
 * Get all areas in a state
 */
export async function getAreasByState(state: string): Promise<Location[]> {
  const response = await getLocations({
    state: [state],
    type: ['area'],
  });
  return response.locations;
}

/**
 * Get locations within a radius
 */
export async function getLocationsInRadius(
  lat: number,
  long: number,
  radiusKm: number
): Promise<Location[]> {
  const response = await getLocations({
    lat,
    long,
    radius: radiusKm,
  });
  return response.locations;
}

/**
 * Get locations with boundaries only
 */
export async function getLocationsWithBoundaries(
  city?: string,
  type?: ('area' | 'city' | 'neighborhood')[]
): Promise<Location[]> {
  const params: LocationsParams = {
    hasBoundary: true,
  };
  
  if (city) params.city = [city];
  if (type) params.type = type;
  
  const response = await getLocations(params);
  return response.locations;
}

/**
 * Location autocomplete/search
 * GET /locations/autocomplete
 */
export async function autocompleteLocations(params: AutocompleteParams): Promise<Location[]> {
  const queryParams: Record<string, unknown> = {
    search: params.search,
  };
  
  if (params.type) queryParams.type = params.type;
  if (params.fields) queryParams.fields = params.fields;
  if (params.map) queryParams.map = params.map;
  if (params.resultsPerPage) queryParams.resultsPerPage = params.resultsPerPage;
  if (params.radius !== undefined) queryParams.radius = params.radius;
  if (params.lat !== undefined) queryParams.lat = params.lat;
  if (params.long !== undefined) queryParams.long = params.long;
  if (params.area) queryParams.area = params.area;
  if (params.city) queryParams.city = params.city;
  if (params.boundary !== undefined) queryParams.boundary = params.boundary;
  if (params.hasBoundary !== undefined) queryParams.hasBoundary = params.hasBoundary;
  if (params.state) queryParams.state = params.state;

  const response = await repliersClient.request<{ locations: Location[] }>({
    endpoint: '/locations/autocomplete',
    params: queryParams,
    authMethod: 'header',
    cache: true,
    cacheDuration: 60, // Short cache for autocomplete (1 minute)
    priority: 'high', // High priority for user-facing autocomplete
  });

  if (response.error || !response.data) {
    console.error('Failed to autocomplete locations:', response.error?.message);
    return [];
  }

  return response.data.locations || [];
}

