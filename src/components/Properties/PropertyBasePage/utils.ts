import type { PropertyListing } from '@/lib/types';

/**
 * Convert slug to city name
 * Handles both regular slugs and slugs ending with -real-estate
 */
export function unslugifyCityName(slug: string): string {
  // Remove -real-estate suffix if present (for backward compatibility)
  let citySlug = slug;
  if (citySlug.endsWith('-real-estate')) {
    citySlug = citySlug.replace(/-real-estate$/, '');
  }
  
  return citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert slug to property type (using exact Repliers API property type values)
 * Based on actual API property types from Repliers
 */
export function slugToPropertyType(slug: string): string {
  const typeMap: Record<string, string> = {
    // Houses/Detached
    'homes': 'Detached',
    'houses': 'Detached',
    'house': 'Detached',
    'detached': 'Detached',
    'detached-homes': 'Detached',
    
    // Condos
    'condos': 'Condo Apartment',
    'condo': 'Condo Apartment',
    'condos-apartment': 'Condo Apartment',
    'condo-apartment': 'Condo Apartment',
    
    // Townhouses
    'townhouses': 'Att/Row/Townhouse',
    'townhouse': 'Att/Row/Townhouse',
    'townhomes': 'Att/Row/Townhouse',
    'row-houses': 'Att/Row/Townhouse',
    'row-homes': 'Att/Row/Townhouse',
    
    // Condo Townhouses
    'condo-townhouses': 'Condo Townhouse',
    'condo-townhouse': 'Condo Townhouse',
    'condos-townhouse': 'Condo Townhouse',
    
    // Semi-Detached
    'semi-detached': 'Semi-Detached',
    'semi-detached-homes': 'Semi-Detached',
    
    // Other types (if needed)
    'lofts': 'Other', // Not in API list, using Other as fallback
    'loft': 'Other',
    'duplex': 'Duplex',
    'triplex': 'Triplex',
    'multiplex': 'Multiplex',
  };
  
  return typeMap[slug.toLowerCase()] || slug;
}

/**
 * Format property type for display
 */
export function formatPropertyType(slug: string): string {
  const typeMap: Record<string, string> = {
    'homes': 'Homes',
    'houses': 'Houses',
    'condos': 'Condos',
    'condo': 'Condos',
    'lofts': 'Lofts',
    'loft': 'Lofts',
    'semi-detached': 'Semi-Detached Homes',
    'semi-detached-homes': 'Semi-Detached Homes',
    'detached': 'Detached Homes',
    'detached-homes': 'Detached Homes',
    'townhouses': 'Townhouses',
    'townhouse': 'Townhouses',
    'townhomes': 'Townhouses',
  };
  
  return typeMap[slug.toLowerCase()] || slug;
}

/**
 * Parse price range from slug
 * Examples:
 * - "under-400000" -> { max: 400000, label: "Under $400,000" }
 * - "over-1000000" -> { min: 1000000, label: "Over $1,000,000" }
 * - "400000-600000" -> { min: 400000, max: 600000, label: "$400,000-$600,000" }
 */
export function parsePriceRangeSlug(slug: string): { min?: number; max?: number; label: string } | null {
  // Remove "under-" or "over-" prefix
  if (slug.startsWith('under-')) {
    const amount = parseInt(slug.replace('under-', ''));
    if (isNaN(amount)) return null;
    return {
      max: amount,
      label: `Under $${amount.toLocaleString()}`,
    };
  }
  
  if (slug.startsWith('over-')) {
    const amount = parseInt(slug.replace('over-', ''));
    if (isNaN(amount)) return null;
    const isLuxury = amount >= 2000000;
    return {
      min: amount,
      label: isLuxury ? `Luxury Homes Over $${amount.toLocaleString()}` : `Over $${amount.toLocaleString()}`,
    };
  }
  
  // Range format: "400000-600000"
  const rangeMatch = slug.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    if (isNaN(min) || isNaN(max)) return null;
    return {
      min,
      max,
      label: `$${min.toLocaleString()}-$${max.toLocaleString()}`,
    };
  }
  
  return null;
}

/**
 * Parse bedroom count from slug
 * Examples:
 * - "1-bedroom" or "1-beds" -> 1
 * - "2-bedroom" or "2-beds" -> 2
 * - "5-bedroom" or "5-beds" or "5-plus-bedroom" -> 5 (with plus flag)
 */
export function parseBedroomSlug(slug: string): { bedrooms: number; isPlus: boolean } | null {
  // Match both singular (-bedroom) and plural (-beds) formats
  const match = slug.match(/^(\d+)(-plus)?-(bedroom|beds)/);
  if (!match) return null;
  
  const bedrooms = parseInt(match[1]);
  const isPlus = !!match[2] || bedrooms >= 5; // 5+ is always "plus"
  
  return { bedrooms, isPlus };
}

/**
 * Format bedroom count for display
 */
export function formatBedrooms(bedrooms: number, isPlus: boolean = false): string {
  if (isPlus || bedrooms >= 5) {
    return `${bedrooms}+ Bedroom`;
  }
  return `${bedrooms} Bedroom`;
}

/**
 * Parse bathroom count from slug
 * Examples:
 * - "1-bathroom" or "1-baths" -> 1
 * - "2-bathroom" or "2-baths" -> 2
 * - "5-bathroom" or "5-baths" or "5-plus-bathroom" -> 5 (with plus flag)
 */
export function parseBathroomSlug(slug: string): { bathrooms: number; isPlus: boolean } | null {
  // Match both singular (-bathroom) and plural (-baths) formats
  const match = slug.match(/^(\d+)(-plus)?-(bathroom|baths)/);
  if (!match) return null;
  
  const bathrooms = parseInt(match[1]);
  const isPlus = !!match[2] || bathrooms >= 5; // 5+ is always "plus"
  
  return { bathrooms, isPlus };
}

/**
 * Format bathroom count for display
 */
export function formatBathrooms(bathrooms: number, isPlus: boolean = false): string {
  if (isPlus || bathrooms >= 5) {
    return `${bathrooms}+ Bathroom`;
  }
  return `${bathrooms} Bathroom`;
}

/**
 * Parse square footage from slug
 * Examples:
 * - "under-600-sqft" -> { max: 600, label: "Under 600 sq ft" }
 * - "over-1000-sqft" -> { min: 1000, label: "Over 1,000 sq ft" }
 * - "1000-1500-sqft" -> { min: 1000, max: 1500, label: "1,000-1,500 sq ft" }
 */
export function parseSqftSlug(slug: string): { min?: number; max?: number; label: string } | null {
  if (slug.startsWith('under-') && slug.endsWith('-sqft')) {
    const amount = parseInt(slug.replace('under-', '').replace('-sqft', ''));
    if (isNaN(amount)) return null;
    return {
      max: amount,
      label: `Under ${amount.toLocaleString()} sq ft`,
    };
  }
  
  if (slug.startsWith('over-') && slug.endsWith('-sqft')) {
    const amount = parseInt(slug.replace('over-', '').replace('-sqft', ''));
    if (isNaN(amount)) return null;
    return {
      min: amount,
      label: `Over ${amount.toLocaleString()} sq ft`,
    };
  }
  
  // Range format: "1000-1500-sqft"
  const rangeMatch = slug.match(/^(\d+)-(\d+)-sqft$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    if (isNaN(min) || isNaN(max)) return null;
    return {
      min,
      max,
      label: `${min.toLocaleString()}-${max.toLocaleString()} sq ft`,
    };
  }
  
  // Size category: "small-condos", "large-condos"
  const sizeCategoryMap: Record<string, { min?: number; max?: number; label: string }> = {
    'small-condos': { max: 600, label: 'Small Condos (Under 600 sq ft)' },
    'large-condos': { min: 1000, label: 'Large Condos (Over 1,000 sq ft)' },
  };
  
  if (sizeCategoryMap[slug]) {
    return sizeCategoryMap[slug];
  }
  
  return null;
}

/**
 * Parse lot size from slug
 * Examples:
 * - "large-lots" -> { min: 0.5, label: "Large Lots" }
 * - "1-plus-acre" -> { min: 1, label: "1+ Acre" }
 * - "5-plus-acres" -> { min: 5, label: "5+ Acres" }
 */
export function parseLotSizeSlug(slug: string): { min?: number; max?: number; label: string; unit: 'acres' | 'sqft' } | null {
  const lotSizeMap: Record<string, { min?: number; max?: number; label: string; unit: 'acres' | 'sqft' }> = {
    'large-lots': { min: 0.5, label: 'Large Lots', unit: 'acres' },
    '1-plus-acre': { min: 1, label: '1+ Acre', unit: 'acres' },
    '5-plus-acres': { min: 5, label: '5+ Acres', unit: 'acres' },
  };
  
  if (lotSizeMap[slug]) {
    return lotSizeMap[slug];
  }
  
  // Parse numeric patterns like "1-plus-acre"
  const acreMatch = slug.match(/^(\d+)-plus-acre$/);
  if (acreMatch) {
    const acres = parseInt(acreMatch[1]);
    if (!isNaN(acres)) {
      return {
        min: acres,
        label: `${acres}+ Acre${acres > 1 ? 's' : ''}`,
        unit: 'acres',
      };
    }
  }
  
  return null;
}

/**
 * Parse year built/age from slug
 * Examples:
 * - "new-homes" -> { maxYearsOld: 5, label: "New Homes (Built in Last 5 Years)" }
 * - "0-5-years-old" -> { maxYearsOld: 5, label: "0-5 Years Old" }
 * - "renovated-homes" -> { type: "renovated", label: "Renovated Homes" }
 * - "heritage-homes" -> { minYearsOld: 50, label: "Heritage Homes (50+ Years Old)" }
 * - "mid-century-homes" -> { type: "mid-century", label: "Mid-Century Homes" }
 */
export function parseYearBuiltSlug(slug: string): { 
  minYearsOld?: number; 
  maxYearsOld?: number; 
  type?: string; 
  label: string 
} | null {
  const yearBuiltMap: Record<string, { minYearsOld?: number; maxYearsOld?: number; type?: string; label: string }> = {
    'new-homes': { maxYearsOld: 5, label: 'New Homes (Built in Last 5 Years)' },
    '0-5-years-old': { maxYearsOld: 5, label: '0-5 Years Old' },
    'renovated-homes': { type: 'renovated', label: 'Renovated Homes' },
    'heritage-homes': { minYearsOld: 50, label: 'Heritage Homes (50+ Years Old)' },
    'mid-century-homes': { type: 'mid-century', label: 'Mid-Century Homes' },
  };
  
  if (yearBuiltMap[slug]) {
    return yearBuiltMap[slug];
  }
  
  return null;
}

/**
 * Parse ownership/fee structure from slug
 * Examples:
 * - "freehold-townhomes" -> { ownership: "freehold", propertyType: "Townhouse", label: "Freehold Townhomes" }
 * - "freehold-houses" -> { ownership: "freehold", propertyType: "House", label: "Freehold Houses" }
 * - "low-maintenance-fees" -> { maxFee: 400, label: "Low Maintenance Fees (Under $400/Month)" }
 * - "no-amenities" -> { amenities: false, label: "No Amenities (Lower Fees)" }
 */
export function parseOwnershipSlug(slug: string): { 
  ownership?: string; 
  propertyType?: string; 
  maxFee?: number; 
  amenities?: boolean; 
  label: string 
} | null {
  const ownershipMap: Record<string, { ownership?: string; propertyType?: string; maxFee?: number; amenities?: boolean; label: string }> = {
    'freehold-townhomes': { ownership: 'freehold', propertyType: 'Townhouse', label: 'Freehold Townhomes' },
    'freehold-houses': { ownership: 'freehold', propertyType: 'House', label: 'Freehold Houses' },
    'low-maintenance-fees': { maxFee: 400, label: 'Low Maintenance Fees (Under $400/Month)' },
    'no-amenities': { amenities: false, label: 'No Amenities (Lower Fees)' },
  };
  
  if (ownershipMap[slug]) {
    return ownershipMap[slug];
  }
  
  return null;
}

/**
 * Parse feature-based filter from slug
 * Returns a feature identifier that can be used for filtering
 */
export function parseFeatureSlug(slug: string): { feature: string; label: string } | null {
  const featureMap: Record<string, { feature: string; label: string }> = {
    // Basement features
    'finished-basement': { feature: 'finished-basement', label: 'Finished Basement' },
    'walkout-basement': { feature: 'walkout-basement', label: 'Walkout Basement' },
    'separate-entrance': { feature: 'separate-entrance', label: 'Separate Entrance' },
    'legal-basement-apartment': { feature: 'legal-basement-apartment', label: 'Legal Basement Apartment' },
    'in-law-suite': { feature: 'in-law-suite', label: 'In-Law Suite' },
    'secondary-suite': { feature: 'secondary-suite', label: 'Secondary Suite / Mortgage Helper' },
    'mortgage-helper': { feature: 'secondary-suite', label: 'Secondary Suite / Mortgage Helper' },
    
    // Pool features
    'swimming-pool': { feature: 'swimming-pool', label: 'Swimming Pool' },
    'in-ground-pool': { feature: 'in-ground-pool', label: 'In-Ground Pool' },
    'above-ground-pool': { feature: 'above-ground-pool', label: 'Above-Ground Pool' },
    'hot-tub': { feature: 'hot-tub', label: 'Hot Tub' },
    
    // Yard/Lot features
    'big-backyard': { feature: 'big-backyard', label: 'Big Backyard' },
    'fenced-yard': { feature: 'fenced-yard', label: 'Fenced Yard' },
    'ravine-lots': { feature: 'ravine-lots', label: 'Ravine Lots' },
    'corner-lots': { feature: 'corner-lots', label: 'Corner Lots' },
    'cul-de-sac': { feature: 'cul-de-sac', label: 'Cul-de-Sac' },
    'backing-onto-park': { feature: 'backing-onto-park', label: 'Backing onto Park' },
    
    // View features
    'city-view': { feature: 'city-view', label: 'City View' },
    'lake-view': { feature: 'lake-view', label: 'Lake View' },
    
    // Parking/Garage
    '1-car-garage': { feature: '1-car-garage', label: '1-Car Garage' },
    '2-car-garage': { feature: '2-car-garage', label: '2-Car Garage' },
    '3-car-garage': { feature: '3-car-garage', label: '3-Car Garage' },
    'detached-garage': { feature: 'detached-garage', label: 'Detached Garage' },
    'tandem-parking': { feature: 'tandem-parking', label: 'Tandem Parking' },
    
    // Interior features
    'hardwood-floors': { feature: 'hardwood-floors', label: 'Hardwood Floors' },
    'open-concept-layout': { feature: 'open-concept-layout', label: 'Open-Concept Layout' },
    'high-ceilings': { feature: 'high-ceilings', label: 'High Ceilings' },
    'gas-stove': { feature: 'gas-stove', label: 'Gas Stove' },
    'chefs-kitchen': { feature: 'chefs-kitchen', label: "Chef's Kitchen" },
    'fireplace': { feature: 'fireplace', label: 'Fireplace' },
    
    // Condo features
    'balcony': { feature: 'balcony', label: 'Balcony' },
    'terrace': { feature: 'terrace', label: 'Terrace' },
    'locker': { feature: 'locker', label: 'Locker' },
    'parking-included': { feature: 'parking-included', label: 'Parking Included' },
    
    // Accessibility
    'accessible-homes': { feature: 'accessible', label: 'Accessible Homes (Wheelchair-Friendly)' },
    'wheelchair-friendly': { feature: 'accessible', label: 'Accessible Homes (Wheelchair-Friendly)' },
    'one-storey-homes': { feature: 'one-storey', label: 'One-Storey Homes' },
    'bungalows-for-seniors': { feature: 'bungalow', label: 'Bungalows for Seniors' },
  };
  
  if (featureMap[slug]) {
    return featureMap[slug];
  }
  
  return null;
}

/**
 * Parse status/time-based filter from slug
 * Examples:
 * - "new-listings" -> { type: "new", label: "New Listings" }
 * - "last-24-hours" -> { hours: 24, label: "Last 24 Hours" }
 * - "last-3-days" -> { days: 3, label: "Last 3 Days" }
 * - "open-houses" -> { type: "open-house", label: "Open Houses" }
 * - "price-reduced" -> { type: "price-reduced", label: "Price-Reduced Homes" }
 * - "back-on-market" -> { type: "back-on-market", label: "Back-on-Market Homes" }
 */
export function parseStatusSlug(slug: string): { 
  type?: string; 
  hours?: number; 
  days?: number; 
  label: string 
} | null {
  const statusMap: Record<string, { type?: string; hours?: number; days?: number; label: string }> = {
    'new-listings': { type: 'new', label: 'New Listings' },
    'last-24-hours': { hours: 24, label: 'Last 24 Hours' },
    'last-3-days': { days: 3, label: 'Last 3 Days' },
    'last-7-days': { days: 7, label: 'Last 7 Days' },
    'open-houses': { type: 'open-house', label: 'Open Houses' },
    'this-weekend': { type: 'open-house-weekend', label: 'This Weekend' },
    'price-reduced': { type: 'price-reduced', label: 'Price-Reduced Homes' },
    'back-on-market': { type: 'back-on-market', label: 'Back-on-Market Homes' },
    'recently-sold': { type: 'sold', label: 'Recently Sold Homes' },
  };
  
  if (statusMap[slug]) {
    return statusMap[slug];
  }
  
  // Parse dynamic patterns like "last-X-days" or "last-X-hours"
  const daysMatch = slug.match(/^last-(\d+)-days$/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    if (!isNaN(days)) {
      return { days, label: `Last ${days} Days` };
    }
  }
  
  const hoursMatch = slug.match(/^last-(\d+)-hours$/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    if (!isNaN(hours)) {
      return { hours, label: `Last ${hours} Hours` };
    }
  }
  
  return null;
}

/**
 * Build title based on page type and parameters
 */
export function buildPropertyPageTitle(
  pageType: string,
  cityName: string,
  propertyType?: string,
  priceRange?: { min?: number; max?: number; label: string },
  bedrooms?: { bedrooms: number; isPlus: boolean },
  bathrooms?: { bathrooms: number; isPlus: boolean },
  sqft?: { min?: number; max?: number; label: string },
  lotSize?: { min?: number; max?: number; label: string; unit: 'acres' | 'sqft' },
  yearBuilt?: { minYearsOld?: number; maxYearsOld?: number; type?: string; label: string },
  ownership?: { ownership?: string; propertyType?: string; maxFee?: number; amenities?: boolean; label: string },
  feature?: { feature: string; label: string },
  status?: { type?: string; hours?: number; days?: number; label: string }
): string {
  let title = '';
  
  // Status/time-based pages come first
  if (status) {
    title = `${status.label} in ${cityName}`;
    return title;
  }
  
  // Year built/age pages
  if (yearBuilt) {
    if (propertyType) {
      title = `${yearBuilt.label} ${formatPropertyType(propertyType)} for Sale in ${cityName}`;
    } else {
      title = `${yearBuilt.label} for Sale in ${cityName}`;
    }
    return title;
  }
  
  // Ownership pages
  if (ownership) {
    title = `${ownership.label} for Sale in ${cityName}`;
    return title;
  }
  
  // Feature-based pages
  if (feature) {
    if (propertyType) {
      title = `${formatPropertyType(propertyType)} for Sale in ${cityName} with ${feature.label}`;
    } else {
      title = `Homes for Sale in ${cityName} with ${feature.label}`;
    }
    return title;
  }
  
  // Size-based pages
  if (sqft) {
    if (propertyType) {
      title = `${formatPropertyType(propertyType)} for Sale in ${cityName} ${sqft.label}`;
    } else {
      title = `Homes for Sale in ${cityName} ${sqft.label}`;
    }
    return title;
  }
  
  // Lot size pages
  if (lotSize) {
    title = `Homes for Sale in ${cityName} on ${lotSize.label}`;
    return title;
  }
  
  // Standard pages with bedrooms/bathrooms
  // Add bedroom prefix if present
  if (bedrooms) {
    title += `${formatBedrooms(bedrooms.bedrooms, bedrooms.isPlus)} `;
  }
  
  // Add bathroom prefix if present
  if (bathrooms) {
    title += `${formatBathrooms(bathrooms.bathrooms, bathrooms.isPlus)} `;
  }
  
  // Add property type or default to "Homes"
  if (propertyType) {
    title += `${formatPropertyType(propertyType)} for Sale in ${cityName}`;
  } else {
    title += `Homes for Sale in ${cityName}`;
  }
  
  // Add price range suffix if present
  if (priceRange) {
    title += ` ${priceRange.label}`;
  }
  
  return title;
}

/**
 * Build description based on page parameters
 */
export function buildPropertyPageDescription(
  cityName: string,
  propertyType?: string,
  priceRange?: { min?: number; max?: number; label: string },
  bedrooms?: { bedrooms: number; isPlus: boolean },
  bathrooms?: { bathrooms: number; isPlus: boolean },
  sqft?: { min?: number; max?: number; label: string },
  lotSize?: { min?: number; max?: number; label: string; unit: 'acres' | 'sqft' },
  yearBuilt?: { minYearsOld?: number; maxYearsOld?: number; type?: string; label: string },
  ownership?: { ownership?: string; propertyType?: string; maxFee?: number; amenities?: boolean; label: string },
  feature?: { feature: string; label: string },
  status?: { type?: string; hours?: number; days?: number; label: string },
  propertyCount: number = 0
): string {
  let description = '';
  
  // Status/time-based descriptions
  if (status) {
    description = `Browse ${status.label.toLowerCase()} in ${cityName}. ${propertyCount > 0 ? propertyCount : 'Hundreds of'} listings available, view photos, and connect with real estate agents.`;
    return description;
  }
  
  // Year built descriptions
  if (yearBuilt) {
    if (propertyType) {
      description = `Find ${yearBuilt.label.toLowerCase()} ${formatPropertyType(propertyType).toLowerCase()} for sale in ${cityName}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    } else {
      description = `Find ${yearBuilt.label.toLowerCase()} for sale in ${cityName}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    }
    return description;
  }
  
  // Ownership descriptions
  if (ownership) {
    description = `Find ${ownership.label.toLowerCase()} for sale in ${cityName}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    return description;
  }
  
  // Feature descriptions
  if (feature) {
    if (propertyType) {
      description = `Find ${formatPropertyType(propertyType).toLowerCase()} for sale in ${cityName} with ${feature.label.toLowerCase()}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    } else {
      description = `Find homes for sale in ${cityName} with ${feature.label.toLowerCase()}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    }
    return description;
  }
  
  // Size descriptions
  if (sqft) {
    if (propertyType) {
      description = `Find ${formatPropertyType(propertyType).toLowerCase()} for sale in ${cityName} ${sqft.label.toLowerCase()}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    } else {
      description = `Find homes for sale in ${cityName} ${sqft.label.toLowerCase()}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    }
    return description;
  }
  
  // Lot size descriptions
  if (lotSize) {
    description = `Find homes for sale in ${cityName} on ${lotSize.label.toLowerCase()}. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
    return description;
  }
  
  // Standard descriptions
  if (bedrooms) {
    description += `Find ${formatBedrooms(bedrooms.bedrooms, bedrooms.isPlus).toLowerCase()} `;
  } else if (bathrooms) {
    description += `Find ${formatBathrooms(bathrooms.bathrooms, bathrooms.isPlus).toLowerCase()} `;
  } else {
    description += 'Find ';
  }
  
  if (propertyType) {
    description += `${formatPropertyType(propertyType).toLowerCase()} `;
  } else {
    description += 'homes ';
  }
  
  description += `for sale in ${cityName}`;
  
  if (priceRange) {
    description += ` ${priceRange.label.toLowerCase()}`;
  }
  
  description += `. Browse ${propertyCount > 0 ? propertyCount : 'hundreds of'} listings, view photos, and connect with real estate agents.`;
  
  return description;
}

/**
 * Filter properties based on criteria
 */
export function filterProperties(
  properties: PropertyListing[],
  cityName?: string,
  propertyType?: string,
  priceRange?: { min?: number; max?: number },
  bedrooms?: { bedrooms: number; isPlus: boolean },
  bathrooms?: { bathrooms: number; isPlus: boolean },
  sqft?: { min?: number; max?: number },
  lotSize?: { min?: number; max?: number; unit: 'acres' | 'sqft' },
  yearBuilt?: { minYearsOld?: number; maxYearsOld?: number; type?: string },
  ownership?: { ownership?: string; propertyType?: string; maxFee?: number; amenities?: boolean },
  feature?: { feature: string },
  status?: { type?: string; hours?: number; days?: number }
): PropertyListing[] {
  let filtered = [...properties];
  
  // Filter by city
  if (cityName) {
    filtered = filtered.filter(prop => 
      prop.address?.city?.toLowerCase() === cityName.toLowerCase()
    );
  }
  
  // Filter by property type
  if (propertyType) {
    // propertyType is already in the correct Repliers API format (e.g., 'Condo Apartment', 'Detached', 'Att/Row/Townhouse')
    // Match against the exact API property type values
    const typeLower = propertyType.toLowerCase();
    filtered = filtered.filter(prop => {
      const propType = prop.details?.propertyType?.toLowerCase() || '';
      
      // Exact match (most common case)
      if (propType === typeLower) return true;
      
      // Handle variations and partial matches for flexibility
      // For "Condo Apartment" - also match "Condo Townhouse" if searching for condos
      if (typeLower === 'condo apartment') {
        return propType.includes('condo') && (propType.includes('apartment') || propType.includes('townhouse'));
      }
      
      // For "Att/Row/Townhouse" - match townhouse variations
      if (typeLower === 'att/row/townhouse' || typeLower.includes('townhouse')) {
        return propType.includes('townhouse') || propType.includes('att/row');
      }
      
      // For "Detached" - match detached homes
      if (typeLower === 'detached') {
        return propType === 'detached' || propType.includes('detached');
      }
      
      // For "Semi-Detached" - exact match
      if (typeLower === 'semi-detached') {
        return propType === 'semi-detached';
      }
      
      // Fallback: partial match
      return propType.includes(typeLower) || typeLower.includes(propType);
    });
  }
  
  // Filter by price range
  if (priceRange) {
    if (priceRange.min !== undefined) {
      filtered = filtered.filter(prop => prop.listPrice >= priceRange.min!);
    }
    if (priceRange.max !== undefined) {
      filtered = filtered.filter(prop => prop.listPrice <= priceRange.max!);
    }
  }
  
  // Filter by bedrooms
  if (bedrooms) {
    filtered = filtered.filter(prop => {
      const propBedrooms = prop.details?.numBedrooms || 0;
      if (bedrooms.isPlus) {
        return propBedrooms >= bedrooms.bedrooms;
      }
      return propBedrooms === bedrooms.bedrooms;
    });
  }
  
  // Filter by bathrooms
  if (bathrooms) {
    filtered = filtered.filter(prop => {
      const propBathrooms = prop.details?.numBathrooms || 0;
      if (bathrooms.isPlus) {
        return propBathrooms >= bathrooms.bathrooms;
      }
      return propBathrooms === bathrooms.bathrooms;
    });
  }
  
  // Filter by square footage
  if (sqft) {
    filtered = filtered.filter(prop => {
      // Handle various sqft formats: string with commas, number, or null
      let propSqft = 0;
      if (prop.details?.sqft) {
        if (typeof prop.details.sqft === 'string') {
          // Remove commas and parse
          const cleaned = prop.details.sqft.replace(/,/g, '').trim();
          // Handle ranges like "1500-2000" (use midpoint or min)
          if (cleaned.includes('-')) {
            const [min, max] = cleaned.split('-').map(s => parseInt(s.trim()));
            if (!isNaN(min) && !isNaN(max)) {
              propSqft = min; // Use minimum for filtering
            }
          } else {
            propSqft = parseInt(cleaned) || 0;
          }
        } else if (typeof prop.details.sqft === 'number') {
          propSqft = prop.details.sqft;
        }
      }
      
      // Skip properties with no sqft data if filtering by sqft
      if (propSqft === 0 && (sqft.min !== undefined || sqft.max !== undefined)) {
        return false;
      }
      
      if (sqft.min !== undefined && propSqft < sqft.min) return false;
      if (sqft.max !== undefined && propSqft > sqft.max) return false;
      return true;
    });
  }
  
  // Filter by lot size
  if (lotSize) {
    filtered = filtered.filter(prop => {
      if (lotSize.unit === 'acres') {
        const propAcres = prop.lot?.acres || 0;
        if (lotSize.min !== undefined && propAcres < lotSize.min) return false;
        if (lotSize.max !== undefined && propAcres > lotSize.max) return false;
      } else {
        const propSqft = prop.lot?.squareFeet || 0;
        if (lotSize.min !== undefined && propSqft < lotSize.min) return false;
        if (lotSize.max !== undefined && propSqft > lotSize.max) return false;
      }
      return true;
    });
  }
  
  // Filter by year built/age
  if (yearBuilt) {
    const currentYear = new Date().getFullYear();
    filtered = filtered.filter(prop => {
      // yearBuilt is stored as string in API, need to parse
      const yearBuiltStr = prop.details?.yearBuilt;
      if (!yearBuiltStr) {
        // Skip properties with no year built data
        return false;
      }
      
      // Handle age ranges like "0-5" (some MLSs provide this format)
      if (yearBuiltStr.includes('-')) {
        const [minAge, maxAge] = yearBuiltStr.split('-').map(a => parseInt(a.trim()));
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          // For age ranges, check if the range overlaps with our criteria
          // If we want "0-5 years old", accept ranges that include 0-5
          if (yearBuilt.maxYearsOld !== undefined) {
            // Want max 5 years old, so accept ranges where minAge <= 5
            if (minAge > yearBuilt.maxYearsOld) return false;
          }
          if (yearBuilt.minYearsOld !== undefined) {
            // Want min 50 years old, so accept ranges where maxAge >= 50
            if (maxAge < yearBuilt.minYearsOld) return false;
          }
          
          // Handle special types with age ranges
          if (yearBuilt.type === 'mid-century') {
            // Mid-century is roughly 1945-1975, which is 50-80 years old (as of 2024)
            const minAgeForMidCentury = currentYear - 1975;
            const maxAgeForMidCentury = currentYear - 1945;
            return minAge <= maxAgeForMidCentury && maxAge >= minAgeForMidCentury;
          }
          
          return true;
        }
      }
      
      // Try to parse as year
      const builtYear = parseInt(yearBuiltStr);
      if (isNaN(builtYear)) return false;
      
      const yearsOld = currentYear - builtYear;
      
      if (yearBuilt.minYearsOld !== undefined && yearsOld < yearBuilt.minYearsOld) return false;
      if (yearBuilt.maxYearsOld !== undefined && yearsOld > yearBuilt.maxYearsOld) return false;
      
      // Handle special types
      if (yearBuilt.type === 'renovated') {
        // Would need renovation date or flag - for now, include all properties
        // This could be enhanced with additional data if available
        return true;
      }
      if (yearBuilt.type === 'mid-century') {
        // Mid-century is roughly 1945-1975
        return builtYear >= 1945 && builtYear <= 1975;
      }
      
      return true;
    });
  }
  
  // Filter by ownership/fee structure
  if (ownership) {
    if (ownership.maxFee !== undefined) {
      // Filter by maintenance fees (for condos)
      filtered = filtered.filter(prop => {
        const fees = prop.condominium?.fees?.maintenance;
        if (fees === null || fees === undefined) return false;
        return fees <= ownership.maxFee!;
      });
    }
    if (ownership.amenities === false) {
      // Filter for properties with no amenities (lower fees)
      filtered = filtered.filter(prop => {
        const amenities = prop.condominium?.amenities || [];
        return amenities.length === 0;
      });
    }
  }
  
  // Filter by features (requires checking description, features string, or specific fields)
  if (feature) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(prop => {
      const description = (prop.details?.description || '').toLowerCase();
      const lotFeatures = (prop.lot?.features || '').toLowerCase();
      const garageInfo = (prop.details?.garage || '').toLowerCase();
      const numGarageSpaces = prop.details?.numGarageSpaces || 0;
      const allText = `${description} ${lotFeatures} ${garageInfo}`.toLowerCase();
      
      // Check numeric garage features first (more reliable)
      if (feature.feature === '1-car-garage' && numGarageSpaces === 1) return true;
      if (feature.feature === '2-car-garage' && numGarageSpaces === 2) return true;
      if (feature.feature === '3-car-garage' && numGarageSpaces >= 3) return true;
      if (feature.feature === 'detached-garage' && garageInfo.includes('detached')) return true;
      
      // Map feature slugs to search terms
      const featureSearchMap: Record<string, string[]> = {
        'finished-basement': ['finished basement', 'finished bsmt'],
        'walkout-basement': ['walkout basement', 'walk-out basement'],
        'separate-entrance': ['separate entrance', 'private entrance'],
        'legal-basement-apartment': ['legal basement', 'legal apartment'],
        'in-law-suite': ['in-law suite', 'inlaw suite'],
        'secondary-suite': ['secondary suite', 'second suite'],
        'swimming-pool': ['swimming pool', 'pool'],
        'in-ground-pool': ['in-ground pool', 'inground pool'],
        'above-ground-pool': ['above-ground pool', 'above ground pool'],
        'hot-tub': ['hot tub', 'hot-tub'],
        'big-backyard': ['large yard', 'big yard', 'spacious yard'],
        'fenced-yard': ['fenced yard', 'fenced backyard'],
        'ravine-lots': ['ravine', 'ravine lot'],
        'corner-lots': ['corner lot', 'corner'],
        'cul-de-sac': ['cul-de-sac', 'cul de sac'],
        'backing-onto-park': ['backing park', 'backs park'],
        'city-view': ['city view', 'cityview'],
        'lake-view': ['lake view', 'lakeview'],
        '1-car-garage': ['1 car garage', 'one car garage', 'single garage'],
        '2-car-garage': ['2 car garage', 'two car garage', 'double garage'],
        '3-car-garage': ['3 car garage', 'three car garage'],
        'detached-garage': ['detached garage', 'detached'],
        'tandem-parking': ['tandem parking'],
        'hardwood-floors': ['hardwood', 'hardwood floor'],
        'open-concept-layout': ['open concept', 'open-concept'],
        'high-ceilings': ['high ceiling', 'high ceilings'],
        'gas-stove': ['gas stove', 'gas range'],
        'chefs-kitchen': ['chef kitchen', "chef's kitchen"],
        'fireplace': ['fireplace', 'fire place'],
        'balcony': ['balcony', 'balconies'],
        'terrace': ['terrace'],
        'locker': ['locker'],
        'parking-included': ['parking included', 'parking incl'],
        'accessible': ['accessible', 'wheelchair', 'handicap'],
        'one-storey': ['one storey', 'one-story', 'single storey'],
        'bungalow': ['bungalow'],
      };
      
      const searchTerms = featureSearchMap[feature.feature] || [feature.feature];
      const matches = searchTerms.some(term => allText.includes(term));
      
      // Debug logging for first few properties
      if (filtered.length < 5 && !matches) {
        console.log('[Feature Filter] Property did not match:', {
          feature: feature.feature,
          searchTerms,
          description: description.substring(0, 100),
          lotFeatures: lotFeatures.substring(0, 50),
        });
      }
      
      return matches;
    });
    
    console.log('[Feature Filter] Applied:', {
      feature: feature.feature,
      beforeCount,
      afterCount: filtered.length,
      filteredOut: beforeCount - filtered.length,
    });
  }
  
  // Filter by status/time
  if (status) {
    if (status.hours || status.days) {
      const now = new Date();
      const cutoffTime = status.hours 
        ? now.getTime() - (status.hours * 60 * 60 * 1000)
        : now.getTime() - (status.days! * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(prop => {
        const listDate = new Date(prop.listDate);
        return listDate.getTime() >= cutoffTime;
      });
    }
    
    if (status.type === 'open-house') {
      filtered = filtered.filter(prop => {
        return (prop.openHouse && prop.openHouse.length > 0);
      });
    }
    
    if (status.type === 'price-reduced') {
      filtered = filtered.filter(prop => {
        // Check if originalPrice exists and is higher than listPrice
        const originalPrice = prop.originalPrice;
        return originalPrice !== undefined && originalPrice > prop.listPrice;
      });
    }
    
    if (status.type === 'back-on-market') {
      filtered = filtered.filter(prop => {
        // Check if lastStatus indicates it was previously sold/terminated
        const lastStatus = prop.lastStatus?.toLowerCase() || '';
        return lastStatus.includes('sold') || lastStatus.includes('terminated');
      });
    }
  }
  
  return filtered;
}

