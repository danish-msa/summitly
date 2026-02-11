import { useState, useEffect, useCallback } from 'react';
import { 
  LocationsResponse, 
  ProcessedLocation, 
  LocationFilters,
  LocationStats,
  LocationCoordinates
} from '@/data/types';
import { LocationDataProcessor, LocationSearchService } from '@/lib/location-utils';

/**
 * Custom hook for managing location data and demographics
 */
export const useLocationData = () => {
  const [locations, setLocations] = useState<ProcessedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LocationFilters>({});

  /**
   * Fetch locations from Repliers API
   */
  const fetchLocations = useCallback(async (apiKey: string, filters?: LocationFilters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.area) queryParams.append('area', filters.area);
      if (filters?.city) queryParams.append('city', filters.city);
      if (filters?.class) queryParams.append('class', filters.class);
      if (filters?.neighborhood) queryParams.append('neighborhood', filters.neighborhood);
      if (filters?.search) queryParams.append('search', filters.search);

      const response = await fetch(
        `https://api.repliers.io/listings/locations?${queryParams.toString()}`,
        {
          headers: {
            'REPLIERS-API-KEY': apiKey,
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.statusText}`);
      }

      const data: LocationsResponse = await response.json();
      const processedLocations = LocationDataProcessor.processLocationsResponse(data);
      
      setLocations(processedLocations);
      LocationSearchService.initialize(processedLocations);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filter locations based on current filters
   */
  const filteredLocations = LocationDataProcessor.filterLocations(locations, filters);

  /**
   * Search locations by query
   */
  const searchLocations = useCallback((query: string, limit?: number) => {
    return LocationSearchService.search(query, limit);
  }, []);

  /**
   * Get popular locations
   */
  const getPopularLocations = useCallback((limit?: number) => {
    return LocationSearchService.getPopularLocations(limit);
  }, []);

  /**
   * Get locations by type
   */
  const getLocationsByType = useCallback((type: 'area' | 'city' | 'neighborhood') => {
    return LocationSearchService.getLocationsByType(type);
  }, []);

  /**
   * Get location hierarchy
   */
  const getLocationHierarchy = useCallback((targetLocation: string) => {
    return LocationDataProcessor.getLocationHierarchy(locations, targetLocation);
  }, [locations]);

  /**
   * Get locations within radius
   */
  const getLocationsInRadius = useCallback((
    center: LocationCoordinates, 
    radiusKm: number
  ) => {
    return LocationDataProcessor.getLocationsInRadius(locations, center, radiusKm);
  }, [locations]);

  /**
   * Calculate location statistics
   */
  const getLocationStats = useCallback((location: ProcessedLocation) => {
    return LocationDataProcessor.calculateLocationStats(location);
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<LocationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    // Data
    locations: filteredLocations,
    allLocations: locations,
    loading,
    error,
    filters,

    // Actions
    fetchLocations,
    searchLocations,
    getPopularLocations,
    getLocationsByType,
    getLocationHierarchy,
    getLocationsInRadius,
    getLocationStats,
    updateFilters,
    clearFilters
  };
};

/**
 * Hook for location demographics and statistics
 */
export const useLocationDemographics = (location?: ProcessedLocation) => {
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      setLoading(true);
      // Simulate API call for additional stats
      setTimeout(() => {
        const calculatedStats = LocationDataProcessor.calculateLocationStats(location);
        setStats(calculatedStats);
        setLoading(false);
      }, 500);
    }
  }, [location]);

  return {
    stats,
    loading
  };
};

/**
 * Hook for location search with autocomplete
 */
export const useLocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProcessedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setQuery(searchQuery);

    // Simulate search delay
    setTimeout(() => {
      const searchResults = LocationSearchService.search(searchQuery, 10);
      setResults(searchResults);
      setIsSearching(false);
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
  }, []);

  return {
    query,
    results,
    isSearching,
    search,
    clearSearch
  };
};
