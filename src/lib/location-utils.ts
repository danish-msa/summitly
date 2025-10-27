import { 
  LocationsResponse, 
  ProcessedLocation, 
  LocationDemographics, 
  LocationStats,
  LocationFilters,
  LocationCoordinates,
  LocationPolygon
} from '@/data/types';

/**
 * Location Data Processing Service
 * Handles Repliers Locations API data transformation and organization
 */

export class LocationDataProcessor {
  /**
   * Process raw Repliers API response into organized location data
   */
  static processLocationsResponse(response: LocationsResponse): ProcessedLocation[] {
    const processedLocations: ProcessedLocation[] = [];

    response.boards.forEach(board => {
      board.classes.forEach(propertyClass => {
        propertyClass.areas.forEach(area => {
          // Process Area level
          const areaLocation: ProcessedLocation = {
            id: `area-${area.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: area.name,
            type: 'area',
            activeCount: this.calculateTotalCount(area.cities),
            coordinates: this.calculateCenterCoordinates(area.cities),
            polygon: this.createAreaPolygon(area.cities),
            children: [],
            demographics: this.calculateAreaDemographics(area, propertyClass.name)
          };

          // Process Cities within Area
          area.cities.forEach(city => {
            const cityLocation: ProcessedLocation = {
              id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: city.name,
              type: 'city',
              parent: area.name,
              activeCount: city.activeCount,
              coordinates: city.location,
              polygon: city.coordinates,
              children: [],
              demographics: this.calculateCityDemographics(city, propertyClass.name)
            };

            // Process Neighborhoods within City
            city.neighborhoods.forEach(neighborhood => {
              const neighborhoodLocation: ProcessedLocation = {
                id: `neighborhood-${neighborhood.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: neighborhood.name,
                type: 'neighborhood',
                parent: city.name,
                activeCount: neighborhood.activeCount,
                coordinates: neighborhood.location,
                polygon: neighborhood.coordinates,
                demographics: this.calculateNeighborhoodDemographics(neighborhood, propertyClass.name)
              };

              cityLocation.children?.push(neighborhoodLocation);
            });

            areaLocation.children?.push(cityLocation);
          });

          processedLocations.push(areaLocation);
        });
      });
    });

    return processedLocations;
  }

  /**
   * Filter locations based on search criteria
   */
  static filterLocations(locations: ProcessedLocation[], filters: LocationFilters): ProcessedLocation[] {
    return locations.filter(location => {
      // Area filter
      if (filters.area && !location.name.toLowerCase().includes(filters.area.toLowerCase())) {
        return false;
      }

      // City filter
      if (filters.city && location.type !== 'city' && location.type !== 'neighborhood') {
        return false;
      }

      // Class filter
      if (filters.class && location.demographics[filters.class] === 0) {
        return false;
      }

      // Neighborhood filter
      if (filters.neighborhood && location.type !== 'neighborhood') {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = location.name.toLowerCase().includes(searchTerm);
        const matchesParent = location.parent?.toLowerCase().includes(searchTerm);
        
        if (!matchesName && !matchesParent) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get location hierarchy (Area -> City -> Neighborhood)
   */
  static getLocationHierarchy(locations: ProcessedLocation[], targetLocation: string): ProcessedLocation[] {
    const hierarchy: ProcessedLocation[] = [];
    
    const findLocation = (locationList: ProcessedLocation[], target: string): ProcessedLocation | null => {
      for (const location of locationList) {
        if (location.name.toLowerCase() === target.toLowerCase()) {
          return location;
        }
        if (location.children) {
          const found = findLocation(location.children, target);
          if (found) return found;
        }
      }
      return null;
    };

    const location = findLocation(locations, targetLocation);
    if (location) {
      hierarchy.push(location);
      
      // Add parent locations
      let current = location;
      while (current.parent) {
        const parent = findLocation(locations, current.parent);
        if (parent) {
          hierarchy.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }
    }

    return hierarchy;
  }

  /**
   * Calculate demographic statistics for a location
   */
  static calculateLocationStats(location: ProcessedLocation): LocationStats {
    const demographics = location.demographics;
    
    return {
      totalProperties: demographics.total,
      residentialCount: demographics.residential,
      condoCount: demographics.condo,
      commercialCount: demographics.commercial,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get locations within a radius of given coordinates
   */
  static getLocationsInRadius(
    locations: ProcessedLocation[], 
    center: LocationCoordinates, 
    radiusKm: number
  ): ProcessedLocation[] {
    return locations.filter(location => {
      const distance = this.calculateDistance(center, location.coordinates);
      return distance <= radiusKm;
    });
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private static calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Calculate total count for an area
   */
  private static calculateTotalCount(cities: any[]): number {
    return cities.reduce((total, city) => total + city.activeCount, 0);
  }

  /**
   * Calculate center coordinates for an area
   */
  private static calculateCenterCoordinates(cities: any[]): LocationCoordinates {
    if (cities.length === 0) return { lat: 0, lng: 0 };
    
    const totalLat = cities.reduce((sum, city) => sum + city.location.lat, 0);
    const totalLng = cities.reduce((sum, city) => sum + city.location.lng, 0);
    
    return {
      lat: totalLat / cities.length,
      lng: totalLng / cities.length
    };
  }

  /**
   * Create polygon for an area (simplified - uses city boundaries)
   */
  private static createAreaPolygon(cities: any[]): LocationPolygon | undefined {
    if (cities.length === 0) return undefined;
    
    // For now, return the first city's polygon as area polygon
    // In a real implementation, you'd merge all city polygons
    return cities[0]?.coordinates;
  }

  /**
   * Calculate demographics for an area
   */
  private static calculateAreaDemographics(area: any, propertyClass: string): any {
    const totalCount = this.calculateTotalCount(area.cities);
    
    return {
      residential: propertyClass === 'residential' ? totalCount : 0,
      condo: propertyClass === 'condo' ? totalCount : 0,
      commercial: propertyClass === 'commercial' ? totalCount : 0,
      total: totalCount
    };
  }

  /**
   * Calculate demographics for a city
   */
  private static calculateCityDemographics(city: any, propertyClass: string): any {
    return {
      residential: propertyClass === 'residential' ? city.activeCount : 0,
      condo: propertyClass === 'condo' ? city.activeCount : 0,
      commercial: propertyClass === 'commercial' ? city.activeCount : 0,
      total: city.activeCount
    };
  }

  /**
   * Calculate demographics for a neighborhood
   */
  private static calculateNeighborhoodDemographics(neighborhood: any, propertyClass: string): any {
    return {
      residential: propertyClass === 'residential' ? neighborhood.activeCount : 0,
      condo: propertyClass === 'condo' ? neighborhood.activeCount : 0,
      commercial: propertyClass === 'commercial' ? neighborhood.activeCount : 0,
      total: neighborhood.activeCount
    };
  }
}

/**
 * Location Search Service
 * Handles location-based searches and filtering
 */
export class LocationSearchService {
  private static locations: ProcessedLocation[] = [];

  /**
   * Initialize with processed location data
   */
  static initialize(locations: ProcessedLocation[]): void {
    this.locations = locations;
  }

  /**
   * Search locations by query
   */
  static search(query: string, limit: number = 10): ProcessedLocation[] {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results: ProcessedLocation[] = [];

    const searchInLocation = (location: ProcessedLocation) => {
      if (location.name.toLowerCase().includes(searchTerm)) {
        results.push(location);
      }
      
      if (location.children) {
        location.children.forEach(searchInLocation);
      }
    };

    this.locations.forEach(searchInLocation);

    return results.slice(0, limit);
  }

  /**
   * Get popular locations (highest active counts)
   */
  static getPopularLocations(limit: number = 10): ProcessedLocation[] {
    const allLocations: ProcessedLocation[] = [];

    const collectLocations = (location: ProcessedLocation) => {
      allLocations.push(location);
      if (location.children) {
        location.children.forEach(collectLocations);
      }
    };

    this.locations.forEach(collectLocations);

    return allLocations
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, limit);
  }

  /**
   * Get locations by type
   */
  static getLocationsByType(type: 'area' | 'city' | 'neighborhood'): ProcessedLocation[] {
    const results: ProcessedLocation[] = [];

    const collectByType = (location: ProcessedLocation) => {
      if (location.type === type) {
        results.push(location);
      }
      if (location.children) {
        location.children.forEach(collectByType);
      }
    };

    this.locations.forEach(collectByType);

    return results;
  }
}
