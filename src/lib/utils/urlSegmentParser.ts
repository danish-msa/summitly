/**
 * URL Segment Parser
 * 
 * Parses URL segments to determine location hierarchy and filters
 * Used by /buy, /rent, and /pre-con routes
 */

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
import type { PropertyPageType } from '@/components/Properties/PropertyBasePage/types';

export interface ParsedSegments {
  city: string;
  locationType: 'city' | 'neighbourhood' | 'intersection' | null;
  locationName: string | null;
  filters: string[];
  pageType: PropertyPageType;
  combinedSlug: string;
}

/**
 * Determine page type from filter slugs
 */
function determinePageTypeFromFilters(filters: string[]): PropertyPageType {
  if (filters.length === 0) {
    return 'by-location';
  }

  if (filters.length === 1) {
    const slug = filters[0];
    
    if (parseStatusSlug(slug)) return 'status';
    if (parsePriceRangeSlug(slug)) return 'price-range';
    if (parseBedroomSlug(slug)) return 'bedrooms';
    if (parseBathroomSlug(slug)) return 'bathrooms';
    if (parseSqftSlug(slug)) return 'sqft';
    if (parseLotSizeSlug(slug)) return 'lot-size';
    if (parseYearBuiltSlug(slug)) return 'year-built';
    if (parseOwnershipSlug(slug)) return 'ownership';
    if (parseFeatureSlug(slug)) return 'feature';
    
    // Check if it's a property type
    const propertyType = slugToPropertyType(slug);
    if (propertyType !== slug.toLowerCase()) {
      return 'propertyType';
    }
    
    return 'by-location';
  }

  if (filters.length === 2) {
    const [slug1, slug2] = filters;
    
    // Check if first is property type
    const propertyType1 = slugToPropertyType(slug1);
    const isPropertyType1 = propertyType1 !== slug1.toLowerCase();
    
    const priceRange1 = parsePriceRangeSlug(slug1);
    const priceRange2 = parsePriceRangeSlug(slug2);
    const bedrooms2 = parseBedroomSlug(slug2);
    const bathrooms2 = parseBathroomSlug(slug2);
    const sqft2 = parseSqftSlug(slug2);
    const lotSize2 = parseLotSizeSlug(slug2);
    const yearBuilt2 = parseYearBuiltSlug(slug2);
    const ownership2 = parseOwnershipSlug(slug2);
    const feature2 = parseFeatureSlug(slug2);

    // Property Type + Filter combinations
    if (isPropertyType1 && priceRange2) return 'propertyType-price';
    if (isPropertyType1 && bedrooms2) return 'propertyType-bedrooms';
    if (isPropertyType1 && bathrooms2) return 'propertyType-bathrooms';
    if (isPropertyType1 && sqft2) return 'propertyType-sqft';
    if (isPropertyType1 && lotSize2) return 'propertyType-lot-size';
    if (isPropertyType1 && yearBuilt2) return 'propertyType-year-built';
    if (isPropertyType1 && ownership2) return 'propertyType-ownership';
    if (isPropertyType1 && feature2) return 'propertyType-feature';
    
    // Price Range + Filter combinations
    if (priceRange1 && bedrooms2) return 'price-bedrooms';
    if (priceRange1 && bathrooms2) return 'price-bathrooms';
    if (priceRange1 && sqft2) return 'price-sqft';
    if (priceRange1 && lotSize2) return 'price-lot-size';
    if (priceRange1 && yearBuilt2) return 'price-year-built';
    if (priceRange1 && feature2) return 'price-feature';
    
    return 'by-location';
  }

  if (filters.length === 3) {
    const [slug1, slug2, slug3] = filters;
    
    // Check if first is property type
    const propertyType1 = slugToPropertyType(slug1);
    const isPropertyType1 = propertyType1 !== slug1.toLowerCase();
    
    const priceRange2 = parsePriceRangeSlug(slug2);
    const bedrooms3 = parseBedroomSlug(slug3);
    const bathrooms3 = parseBathroomSlug(slug3);
    const sqft3 = parseSqftSlug(slug3);
    const feature3 = parseFeatureSlug(slug3);

    // Property Type + Price + Filter combinations
    if (isPropertyType1 && priceRange2 && bedrooms3) return 'propertyType-price-bedrooms';
    if (isPropertyType1 && priceRange2 && bathrooms3) return 'propertyType-price-bathrooms';
    if (isPropertyType1 && priceRange2 && sqft3) return 'propertyType-price-sqft';
    if (isPropertyType1 && priceRange2 && feature3) return 'propertyType-price-feature';
    
    return 'by-location';
  }

  return 'by-location';
}

/**
 * Parse URL segments into structured data
 */
export function parseUrlSegments(segments: string[]): ParsedSegments {
  if (segments.length === 0) {
    return {
      city: '',
      locationType: null,
      locationName: null,
      filters: [],
      pageType: 'by-location',
      combinedSlug: '',
    };
  }

  const citySlug = segments[0];
  const city = citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // If only city, return city page
  if (segments.length === 1) {
    return {
      city,
      locationType: 'city',
      locationName: null,
      filters: [],
      pageType: 'by-location',
      combinedSlug: citySlug,
    };
  }

  // Check if second segment is a filter (no location)
  const secondSegment = segments[1];
  const isFilter = (slug: string): boolean => {
    return !!(
      parsePriceRangeSlug(slug) ||
      parseBedroomSlug(slug) ||
      parseBathroomSlug(slug) ||
      parseSqftSlug(slug) ||
      parseLotSizeSlug(slug) ||
      parseYearBuiltSlug(slug) ||
      parseOwnershipSlug(slug) ||
      parseFeatureSlug(slug) ||
      parseStatusSlug(slug) ||
      slugToPropertyType(slug) !== slug.toLowerCase()
    );
  };

  // If second segment is a filter, treat as city + filters
  if (isFilter(secondSegment)) {
    const filters = segments.slice(1);
    const pageType = determinePageTypeFromFilters(filters);
    return {
      city,
      locationType: 'city',
      locationName: null,
      filters,
      pageType,
      combinedSlug: filters.join('-'),
    };
  }

  // Otherwise, second segment is a location (neighbourhood or intersection)
  // We'll determine which one in the route component using locationDetection
  const locationSlug = secondSegment;
  const locationName = locationSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Remaining segments are filters
  const filters = segments.slice(2);
  const pageType = filters.length > 0 
    ? determinePageTypeFromFilters(filters)
    : 'by-location';

  return {
    city,
    locationType: null, // Will be determined by locationDetection
    locationName,
    filters,
    pageType,
    combinedSlug: filters.length > 0 ? filters.join('-') : locationSlug,
  };
}

