import { 
  LocationsResponse, 
  LocationFilters,
  ProcessedLocation 
} from '@/data/types';
import { LocationDataProcessor } from '@/lib/location-utils';

/**
 * Repliers Locations API Service
 * Handles all API calls to the Repliers Locations endpoint
 */
export class RepliersLocationsAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.repliers.io/listings/locations';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch locations with optional filters
   */
  async fetchLocations(filters?: LocationFilters): Promise<ProcessedLocation[]> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const url = `${this.baseUrl}?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'REPLIERS-API-KEY': this.apiKey,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: LocationsResponse = await response.json();
      return LocationDataProcessor.processLocationsResponse(data);

    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  /**
   * Fetch locations by area
   */
  async fetchLocationsByArea(area: string): Promise<ProcessedLocation[]> {
    return this.fetchLocations({ area });
  }

  /**
   * Fetch locations by city
   */
  async fetchLocationsByCity(city: string): Promise<ProcessedLocation[]> {
    return this.fetchLocations({ city });
  }

  /**
   * Fetch locations by property class
   */
  async fetchLocationsByClass(propertyClass: 'residential' | 'condo' | 'commercial'): Promise<ProcessedLocation[]> {
    return this.fetchLocations({ class: propertyClass });
  }

  /**
   * Search locations by query
   */
  async searchLocations(query: string): Promise<ProcessedLocation[]> {
    return this.fetchLocations({ search: query });
  }

  /**
   * Fetch locations by neighborhood
   */
  async fetchLocationsByNeighborhood(neighborhood: string): Promise<ProcessedLocation[]> {
    return this.fetchLocations({ neighborhood });
  }

  /**
   * Fetch all locations (no filters)
   */
  async fetchAllLocations(): Promise<ProcessedLocation[]> {
    return this.fetchLocations();
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters?: LocationFilters): string {
    const params = new URLSearchParams();

    if (filters?.area) {
      params.append('area', filters.area);
    }

    if (filters?.city) {
      params.append('city', filters.city);
    }

    if (filters?.class) {
      params.append('class', filters.class);
    }

    if (filters?.neighborhood) {
      params.append('neighborhood', filters.neighborhood);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    return params.toString();
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.fetchLocations();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API usage statistics (if available)
   */
  async getApiStats(): Promise<{ totalRequests: number; remainingRequests: number } | null> {
    // This would depend on Repliers API providing usage stats
    // For now, return null as it's not available in the current API
    return null;
  }
}

/**
 * Location Data Cache Service
 * Implements caching for location data to reduce API calls
 */
export class LocationDataCache {
  private cache: Map<string, { data: ProcessedLocation[]; timestamp: number }> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   */
  get(key: string): ProcessedLocation[] | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data
   */
  set(key: string, data: ProcessedLocation[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate cache key from filters
   */
  generateCacheKey(filters?: LocationFilters): string {
    if (!filters) {
      return 'all-locations';
    }

    const sortedKeys = Object.keys(filters).sort();
    const keyParts = sortedKeys.map(key => `${key}:${filters[key as keyof LocationFilters]}`);
    
    return keyParts.join('|');
  }
}

/**
 * Enhanced Location Service with caching
 */
export class LocationService {
  private api: RepliersLocationsAPI;
  private cache: LocationDataCache;

  constructor(apiKey: string) {
    this.api = new RepliersLocationsAPI(apiKey);
    this.cache = new LocationDataCache();
  }

  /**
   * Fetch locations with caching
   */
  async fetchLocations(filters?: LocationFilters, useCache: boolean = true): Promise<ProcessedLocation[]> {
    const cacheKey = this.cache.generateCacheKey(filters);

    // Try to get from cache first
    if (useCache) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Fetch from API
    const data = await this.api.fetchLocations(filters);

    // Cache the result
    if (useCache) {
      this.cache.set(cacheKey, data);
    }

    return data;
  }

  /**
   * Get all available areas
   */
  async getAreas(): Promise<string[]> {
    const locations = await this.fetchLocations();
    const areas = new Set<string>();

    locations.forEach(location => {
      if (location.type === 'area') {
        areas.add(location.name);
      }
    });

    return Array.from(areas).sort();
  }

  /**
   * Get all available cities
   */
  async getCities(area?: string): Promise<string[]> {
    const locations = await this.fetchLocations();
    const cities = new Set<string>();

    locations.forEach(location => {
      if (location.type === 'city' && (!area || location.parent === area)) {
        cities.add(location.name);
      }
    });

    return Array.from(cities).sort();
  }

  /**
   * Get all available neighborhoods
   */
  async getNeighborhoods(city?: string): Promise<string[]> {
    const locations = await this.fetchLocations();
    const neighborhoods = new Set<string>();

    locations.forEach(location => {
      if (location.type === 'neighborhood' && (!city || location.parent === city)) {
        neighborhoods.add(location.name);
      }
    });

    return Array.from(neighborhoods).sort();
  }

  /**
   * Get location statistics
   */
  async getLocationStatistics(): Promise<{
    totalAreas: number;
    totalCities: number;
    totalNeighborhoods: number;
    totalProperties: number;
  }> {
    const locations = await this.fetchLocations();
    
    let totalAreas = 0;
    let totalCities = 0;
    let totalNeighborhoods = 0;
    let totalProperties = 0;

    const countLocations = (location: ProcessedLocation) => {
      if (location.type === 'area') totalAreas++;
      if (location.type === 'city') totalCities++;
      if (location.type === 'neighborhood') totalNeighborhoods++;
      
      totalProperties += location.activeCount;

      if (location.children) {
        location.children.forEach(countLocations);
      }
    };

    locations.forEach(countLocations);

    return {
      totalAreas,
      totalCities,
      totalNeighborhoods,
      totalProperties
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    return this.api.validateApiKey();
  }
}
