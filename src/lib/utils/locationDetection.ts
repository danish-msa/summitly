/**
 * Location Detection Utilities
 * 
 * Determines if a URL segment is a location (neighbourhood/intersection) or a filter
 */

import { getListings } from '@/lib/api/repliers/services/listings';
import { 
  parsePriceRangeSlug,
  parseBedroomSlug,
  parseBathroomSlug,
  parseSqftSlug,
  parseLotSizeSlug,
  parseYearBuiltSlug,
  parseOwnershipSlug,
  parseFeatureSlug,
  parseStatusSlug,
  slugToPropertyType,
} from '@/components/Properties/PropertyBasePage/utils';

/**
 * Check if a slug is a known filter pattern
 */
export function isFilterSlug(slug: string): boolean {
  // Check all known filter types
  if (parsePriceRangeSlug(slug)) return true;
  if (parseBedroomSlug(slug)) return true;
  if (parseBathroomSlug(slug)) return true;
  if (parseSqftSlug(slug)) return true;
  if (parseLotSizeSlug(slug)) return true;
  if (parseYearBuiltSlug(slug)) return true;
  if (parseOwnershipSlug(slug)) return true;
  if (parseFeatureSlug(slug)) return true;
  if (parseStatusSlug(slug)) return true;
  
  // Check if it's a property type (but not a known location)
  const propertyType = slugToPropertyType(slug);
  if (propertyType !== slug.toLowerCase()) return true;
  
  return false;
}

/**
 * Check if a slug is a reserved route name
 */
export function isReservedRoute(slug: string): boolean {
  const reserved = [
    'trends',
    'areas',
    'neighbourhoods',
    'communities',
    'intersections',
    'projects',
  ];
  return reserved.includes(slug.toLowerCase());
}

/**
 * Convert intersection name to URL slug
 * Example: "Markham Rd & McNicoll Ave" -> "markham-rd-and-mcnicoll-ave"
 */
export function intersectionToSlug(intersection: string): string {
  return intersection
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert URL slug back to intersection name
 * Example: "markham-rd-and-mcnicoll-ave" -> "Markham Rd & McNicoll Ave"
 */
export function slugToIntersection(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      // Handle common abbreviations
      if (word === 'and') return '&';
      if (word === 'rd') return 'Rd';
      if (word === 'st') return 'St';
      if (word === 'ave') return 'Ave';
      if (word === 'blvd') return 'Blvd';
      if (word === 'dr') return 'Dr';
      if (word === 'ct') return 'Ct';
      if (word === 'ln') return 'Ln';
      if (word === 'pl') return 'Pl';
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\s+&\s+/g, ' & ')
    .trim();
}

/**
 * Fetch all unique intersections for a city
 * Uses fields parameter to only fetch intersection data
 */
export async function getIntersectionsForCity(city: string): Promise<string[]> {
  try {
    // Use fields parameter to only get intersection data (more efficient)
    const response = await getListings({
      city,
      status: 'A',
      resultsPerPage: 1000,
      page: 1,
      fields: 'address.majorIntersection',
    } as Record<string, unknown>);

    const intersections = new Set<string>();
    
    response.listings.forEach(listing => {
      const intersection = listing.address?.majorIntersection;
      if (intersection && intersection.trim()) {
        intersections.add(intersection.trim());
      }
    });

    return Array.from(intersections).sort();
  } catch (error) {
    console.error('Error fetching intersections:', error);
    return [];
  }
}

/**
 * Fetch all unique neighbourhoods for a city
 */
export async function getNeighbourhoodsForCity(city: string): Promise<string[]> {
  try {
    const response = await getListings({
      city,
      status: 'A',
      resultsPerPage: 1000,
      page: 1,
    });

    const neighbourhoods = new Set<string>();
    
    response.listings.forEach(listing => {
      const neighbourhood = listing.address?.neighborhood;
      if (neighbourhood && neighbourhood.trim()) {
        neighbourhoods.add(neighbourhood.trim());
      }
    });

    return Array.from(neighbourhoods).sort();
  } catch (error) {
    console.error('Error fetching neighbourhoods:', error);
    return [];
  }
}

/**
 * Check if a slug matches a known neighbourhood in a city
 */
export async function isNeighbourhoodSlug(slug: string, city: string): Promise<boolean> {
  const neighbourhoods = await getNeighbourhoodsForCity(city);
  const slugLower = slug.toLowerCase();
  
  return neighbourhoods.some(neighbourhood => {
    const neighbourhoodSlug = neighbourhood
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return neighbourhoodSlug === slugLower;
  });
}

/**
 * Check if a slug matches a known intersection in a city
 */
export async function isIntersectionSlug(slug: string, city: string): Promise<boolean> {
  const intersections = await getIntersectionsForCity(city);
  const slugLower = slug.toLowerCase();
  
  return intersections.some(intersection => {
    const intersectionSlug = intersectionToSlug(intersection);
    return intersectionSlug === slugLower;
  });
}

/**
 * Parse URL segments to determine location and filters
 * Returns: { city, locationType, locationName, filters }
 */
export interface ParsedUrlSegments {
  city: string;
  locationType: 'city' | 'neighbourhood' | 'intersection' | null;
  locationName: string | null;
  filters: string[];
}

export async function parseUrlSegments(
  segments: string[],
  citySlug: string
): Promise<ParsedUrlSegments> {
  const city = citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (segments.length === 0) {
    return {
      city,
      locationType: 'city',
      locationName: null,
      filters: [],
    };
  }

  // First segment could be location or filter
  const firstSegment = segments[0];
  
  // Check if it's a reserved route
  if (isReservedRoute(firstSegment)) {
    return {
      city,
      locationType: 'city',
      locationName: null,
      filters: [],
    };
  }

  // Check if it's a filter
  if (isFilterSlug(firstSegment)) {
    return {
      city,
      locationType: 'city',
      locationName: null,
      filters: segments,
    };
  }

  // Check if it's a neighbourhood
  const isNeighbourhood = await isNeighbourhoodSlug(firstSegment, city);
  if (isNeighbourhood) {
    // Get the actual neighbourhood name from the database (not slug-converted)
    // This ensures the name matches what's in the API
    const neighbourhoods = await getNeighbourhoodsForCity(city);
    const slugLower = firstSegment.toLowerCase();
    const actualNeighbourhood = neighbourhoods.find(neighbourhood => {
      const neighbourhoodSlug = neighbourhood
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      return neighbourhoodSlug === slugLower;
    });
    
    // Use the actual neighbourhood name from database, or fallback to slug conversion
    const locationName = actualNeighbourhood || firstSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Remaining segments are filters
    const filters = segments.slice(1).filter(seg => !isReservedRoute(seg));
    
    return {
      city,
      locationType: 'neighbourhood',
      locationName,
      filters,
    };
  }

  // Check if it's an intersection
  const isIntersection = await isIntersectionSlug(firstSegment, city);
  if (isIntersection) {
    const locationName = slugToIntersection(firstSegment);
    
    // Remaining segments are filters
    const filters = segments.slice(1).filter(seg => !isReservedRoute(seg));
    
    return {
      city,
      locationType: 'intersection',
      locationName,
      filters,
    };
  }

  // If we can't determine, assume it's a filter (fallback)
  return {
    city,
    locationType: 'city',
    locationName: null,
    filters: segments,
  };
}

