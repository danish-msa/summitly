import { useEffect, useState, useMemo, useCallback } from 'react';
import type { PropertyListing } from '@/lib/types';
import type { PropertyPageType, PropertyPageInfo } from './types';
import type { FilterState } from '@/lib/types/filters';
import { REGIONS } from '@/lib/types/filters';
import { RepliersAPI } from '@/lib/api/repliers';
import {
  unslugifyCityName,
  slugToPropertyType,
  parsePriceRangeSlug,
  parseBedroomSlug,
  parseBathroomSlug,
  parseSqftSlug,
  parseLotSizeSlug,
  parseYearBuiltSlug,
  parseOwnershipSlug,
  parseFeatureSlug,
  parseStatusSlug,
  buildPropertyPageTitle,
  buildPropertyPageDescription,
  filterProperties,
} from './utils';

interface UsePropertyDataProps {
  slug: string;
  pageType: PropertyPageType;
  citySlug?: string;
  filters: FilterState;
  locationType?: 'city' | 'neighbourhood' | 'intersection' | null;
  locationName?: string | null;
  listingType?: 'sell' | 'rent'; // Pass listingType directly from props
}

export const usePropertyData = ({ slug, pageType, citySlug, filters, locationType, locationName, listingType }: UsePropertyDataProps) => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageInfo, setPageInfo] = useState<PropertyPageInfo | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 24; // Properties per page

  // Parse parameters from slug and pageType
  const parsedParams = useMemo(() => {
    const cityName = citySlug ? unslugifyCityName(citySlug) : null;
    let propertyType: string | undefined;
    let priceRange: { min?: number; max?: number; label: string } | undefined;
    let bedrooms: { bedrooms: number; isPlus: boolean } | undefined;
    let bathrooms: { bathrooms: number; isPlus: boolean } | undefined;
    let sqft: { min?: number; max?: number; label: string } | undefined;
    let lotSize: { min?: number; max?: number; label: string; unit: 'acres' | 'sqft' } | undefined;
    let yearBuilt: { minYearsOld?: number; maxYearsOld?: number; type?: string; label: string } | undefined;
    let ownership: { ownership?: string; propertyType?: string; maxFee?: number; amenities?: boolean; label: string } | undefined;
    let feature: { feature: string; label: string } | undefined;
    let status: { type?: string; hours?: number; days?: number; label: string } | undefined;

    // Parse based on pageType
    // Only parse propertyType for single propertyType pages (not combined pages)
    if (pageType === 'propertyType') {
      propertyType = slugToPropertyType(slug);
    }

    // Only parse priceRange for single price-range pages (not combined pages)
    if (pageType === 'price-range') {
      priceRange = parsePriceRangeSlug(slug) ?? undefined;
    }

    if (pageType === 'bedrooms' || pageType.includes('bedrooms')) {
      bedrooms = parseBedroomSlug(slug) ?? undefined;
      console.log('[PropertyBasePage] Parsing bedrooms:', {
        slug,
        pageType,
        bedrooms,
      });
    }

    if (pageType === 'bathrooms' || pageType.includes('bathrooms')) {
      bathrooms = parseBathroomSlug(slug) ?? undefined;
      console.log('[PropertyBasePage] Parsing bathrooms:', {
        slug,
        pageType,
        bathrooms,
      });
    }

    if (pageType === 'sqft' || pageType.includes('sqft')) {
      sqft = parseSqftSlug(slug) ?? undefined;
    }

    if (pageType === 'lot-size' || pageType.includes('lot-size')) {
      lotSize = parseLotSizeSlug(slug) ?? undefined;
    }

    if (pageType === 'year-built' || pageType.includes('year-built')) {
      yearBuilt = parseYearBuiltSlug(slug) ?? undefined;
    }

    if (pageType === 'ownership' || pageType.includes('ownership')) {
      ownership = parseOwnershipSlug(slug) ?? undefined;
    }

    if (pageType === 'feature' || pageType.includes('feature')) {
      feature = parseFeatureSlug(slug) ?? undefined;
    }

    if (pageType === 'status' || pageType.includes('status')) {
      status = parseStatusSlug(slug) ?? undefined;
    }

    // For combined pages, parse multiple parts
    if (pageType === 'propertyType-price') {
      // Format: "condos-under-500000" or "condos-400000-600000"
      const parts = slug.split('-');
      // Find property type (first part)
      propertyType = slugToPropertyType(parts[0]);
      // Find price range (rest)
      const priceSlug = parts.slice(1).join('-');
      priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
    }

    if (pageType === 'propertyType-bedrooms') {
      // Format: "condos-2-bedroom"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const bedroomSlug = parts.slice(1).join('-');
      bedrooms = parseBedroomSlug(bedroomSlug) ?? undefined;
    }

    if (pageType === 'propertyType-bathrooms') {
      // Format: "condos-2-bathroom"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const bathroomSlug = parts.slice(1).join('-');
      bathrooms = parseBathroomSlug(bathroomSlug) ?? undefined;
    }

    if (pageType === 'propertyType-sqft') {
      // Format: "condos-under-600-sqft"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const sqftSlug = parts.slice(1).join('-');
      sqft = parseSqftSlug(sqftSlug) ?? undefined;
    }

    if (pageType === 'propertyType-lot-size') {
      // Format: "houses-large-lots"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const lotSizeSlug = parts.slice(1).join('-');
      lotSize = parseLotSizeSlug(lotSizeSlug) ?? undefined;
    }

    if (pageType === 'propertyType-year-built') {
      // Format: "condos-new-homes"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const yearBuiltSlug = parts.slice(1).join('-');
      yearBuilt = parseYearBuiltSlug(yearBuiltSlug) ?? undefined;
    }

    if (pageType === 'propertyType-ownership') {
      // Format: "townhomes-freehold-townhomes"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const ownershipSlug = parts.slice(1).join('-');
      ownership = parseOwnershipSlug(ownershipSlug) ?? undefined;
    }

    if (pageType === 'propertyType-feature') {
      // Format: "houses-swimming-pool" or "condos-balcony"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      const featureSlug = parts.slice(1).join('-');
      feature = parseFeatureSlug(featureSlug) ?? undefined;
      
      console.log('[PropertyBasePage] Parsing propertyType-feature:', {
        slug,
        parts,
        propertyType,
        featureSlug,
        feature,
      });
    }

    if (pageType === 'price-bedrooms') {
      // Format: "under-500000-2-bedroom"
      const parts = slug.split('-');
      // Find price range (first part)
      const priceSlug = parts.slice(0, -2).join('-'); // Everything except last 2 parts (bedroom)
      priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
      // Find bedrooms (last part)
      const bedroomSlug = parts.slice(-2).join('-');
      bedrooms = parseBedroomSlug(bedroomSlug) ?? undefined;
    }

    if (pageType === 'price-bathrooms') {
      // Format: "under-500000-2-bathroom"
      const parts = slug.split('-');
      // Find price range (first part)
      const priceSlug = parts.slice(0, -2).join('-'); // Everything except last 2 parts (bathroom)
      priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
      // Find bathrooms (last part)
      const bathroomSlug = parts.slice(-2).join('-');
      bathrooms = parseBathroomSlug(bathroomSlug) ?? undefined;
    }

    if (pageType === 'price-sqft') {
      // Format: "under-500000-1000-1500-sqft"
      const parts = slug.split('-');
      // Find price range (everything before sqft-related parts)
      const sqftIndex = parts.findIndex(p => p === 'sqft');
      if (sqftIndex > 0) {
        const priceSlug = parts.slice(0, sqftIndex - (parts[sqftIndex - 1] === 'over' || parts[sqftIndex - 1] === 'under' ? 1 : 0)).join('-');
        priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
        const sqftSlug = parts.slice(sqftIndex - (parts[sqftIndex - 1] === 'over' || parts[sqftIndex - 1] === 'under' ? 1 : 0)).join('-');
        sqft = parseSqftSlug(sqftSlug) ?? undefined;
      }
    }

    if (pageType === 'price-lot-size') {
      // Format: "under-500000-large-lots"
      const parts = slug.split('-');
      // Find price range (first part)
      const priceSlug = parts.slice(0, -2).join('-');
      priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
      // Find lot size (last parts)
      const lotSizeSlug = parts.slice(-2).join('-');
      lotSize = parseLotSizeSlug(lotSizeSlug) ?? undefined;
    }

    if (pageType === 'price-year-built') {
      // Format: "under-500000-new-homes"
      const parts = slug.split('-');
      // Find price range (first part)
      const priceSlug = parts.slice(0, -2).join('-');
      priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
      // Find year built (last parts)
      const yearBuiltSlug = parts.slice(-2).join('-');
      yearBuilt = parseYearBuiltSlug(yearBuiltSlug) ?? undefined;
    }

    if (pageType === 'price-feature') {
      // Format: "under-500000-swimming-pool"
      const parts = slug.split('-');
      // Find price range (first part)
      const priceSlug = parts.slice(0, -2).join('-');
      priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
      // Find feature (last parts)
      const featureSlug = parts.slice(-2).join('-');
      feature = parseFeatureSlug(featureSlug) ?? undefined;
    }

    if (pageType === 'propertyType-price-bedrooms') {
      // Format: "condos-under-500000-2-bedroom"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      
      // Find where price range ends and bedrooms start
      // Look for "bedroom" keyword
      const bedroomIndex = parts.findIndex(p => p === 'bedroom');
      if (bedroomIndex > 0) {
        const priceSlug = parts.slice(1, bedroomIndex - 1).join('-');
        priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
        const bedroomSlug = parts.slice(bedroomIndex - 1).join('-');
        bedrooms = parseBedroomSlug(bedroomSlug) ?? undefined;
      }
    }

    if (pageType === 'propertyType-price-bathrooms') {
      // Format: "condos-under-500000-2-bathroom"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      
      // Find where price range ends and bathrooms start
      // Look for "bathroom" keyword
      const bathroomIndex = parts.findIndex(p => p === 'bathroom');
      if (bathroomIndex > 0) {
        const priceSlug = parts.slice(1, bathroomIndex - 1).join('-');
        priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
        const bathroomSlug = parts.slice(bathroomIndex - 1).join('-');
        bathrooms = parseBathroomSlug(bathroomSlug) ?? undefined;
      }
    }

    if (pageType === 'propertyType-price-sqft') {
      // Format: "condos-under-500000-1000-1500-sqft" or "condos-400000-600000-1000-1500-sqft"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      
      // Find where price range ends and sqft starts
      // Look for "sqft" keyword
      const sqftIndex = parts.findIndex(p => p === 'sqft');
      if (sqftIndex > 0) {
        // Price format is always either:
        // 1. "under-XXXXX" (parts[1] = 'under', parts[2] = number) -> price ends at index 3
        // 2. "over-XXXXX" (parts[1] = 'over', parts[2] = number) -> price ends at index 3
        // 3. "XXXXX-YYYYY" (parts[1] and parts[2] are numbers) -> price ends at index 3
        // So price always ends at index 3 (after propertyType at index 0)
        const priceEndIndex = 3; // Price is always parts[1] and parts[2]
        
        const priceSlug = parts.slice(1, priceEndIndex).join('-');
        priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
        
        // Sqft slug includes everything from priceEndIndex to sqftIndex (inclusive)
        // Format: "1000-1500-sqft" or "under-600-sqft" or "over-1000-sqft"
        const sqftSlug = parts.slice(priceEndIndex, sqftIndex + 1).join('-');
        sqft = parseSqftSlug(sqftSlug) ?? undefined;
        
        console.log('[PropertyBasePage] Parsing propertyType-price-sqft:', {
          slug,
          parts,
          sqftIndex,
          priceEndIndex,
          priceSlug,
          sqftSlug,
          priceRange,
          sqft,
        });
      }
    }

    if (pageType === 'propertyType-price-feature') {
      // Format: "condos-under-500000-swimming-pool"
      const parts = slug.split('-');
      propertyType = slugToPropertyType(parts[0]);
      
      // Find where price range ends - look for common feature keywords
      // Features typically have 1-3 words, so we need to find the split point
      // Try to find price range first, then assume rest is feature
      let priceEndIndex = parts.length;
      for (let i = 1; i < parts.length; i++) {
        // Check if this could be the start of a feature
        const potentialFeatureSlug = parts.slice(i).join('-');
        const featureCheck = parseFeatureSlug(potentialFeatureSlug);
        if (featureCheck) {
          priceEndIndex = i;
          break;
        }
      }
      
      if (priceEndIndex < parts.length) {
        const priceSlug = parts.slice(1, priceEndIndex).join('-');
        priceRange = parsePriceRangeSlug(priceSlug) ?? undefined;
        const featureSlug = parts.slice(priceEndIndex).join('-');
        feature = parseFeatureSlug(featureSlug) ?? undefined;
      }
    }

    return { cityName, propertyType, priceRange, bedrooms, bathrooms, sqft, lotSize, yearBuilt, ownership, feature, status };
  }, [slug, pageType, citySlug]);

  // Load properties function (supports pagination and infinite scroll)
  const loadProperties = useCallback(async (page: number = 1, append: boolean = false) => {
    console.log('[PropertyBasePage] loadProperties called:', { page, append, filters: filters.listingType });
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

        // Build API query parameters
        const apiParams: Record<string, string | number> = {
          status: 'A', // Active listings
          resultsPerPage: resultsPerPage,
          page: page, // Use the page parameter
        };

        // Add city filter if available
        // Priority: 1) URL city (parsedParams.cityName), 2) Global filter city (filters.locationArea), 3) Global filter region
        if (parsedParams.cityName) {
          apiParams.city = parsedParams.cityName;
        } else if (filters.locationArea && filters.locationArea !== 'all') {
          // If a specific city is selected in global filters, use that
          apiParams.city = filters.locationArea;
        } else if (filters.location && filters.location !== 'all') {
          // If only region is selected, use the region name
          const selectedRegion = REGIONS.find(reg => reg.id === filters.location);
          if (selectedRegion) {
            apiParams.city = selectedRegion.name;
          }
        }

        // Add neighborhood filter if locationType is neighbourhood
        if (locationType === 'neighbourhood' && locationName) {
          apiParams.neighborhood = locationName;
          console.log('[PropertyBasePage] Adding neighborhood filter:', {
            locationType,
            locationName,
            apiParams: { ...apiParams, neighborhood: locationName },
          });
        }

        // Add majorIntersection filter if locationType is intersection
        if (locationType === 'intersection' && locationName) {
          apiParams.majorIntersection = locationName;
        }

        // Add listing type filter (Sale or Lease)
        // Priority: 1) listingType prop, 2) filters.listingType
        const effectiveListingType = listingType || filters.listingType;
        if (effectiveListingType === 'sell') {
          apiParams.type = 'Sale';
        } else if (effectiveListingType === 'rent') {
          apiParams.type = 'Lease';
        }

        // Add property type filter if available
        if (parsedParams.propertyType) {
          // slugToPropertyType already returns the correct Repliers API property type value
          // No additional mapping needed - use it directly
          apiParams.propertyType = parsedParams.propertyType;
          
          // Debug logging
          console.log('[PropertyBasePage] Property type filter:', {
            parsed: parsedParams.propertyType,
            slug,
            pageType,
            apiParamsPropertyType: apiParams.propertyType,
          });
        } else {
          console.log('[PropertyBasePage] No property type filter - parsedParams.propertyType:', parsedParams.propertyType);
        }

        // Add price filters if available
        if (parsedParams.priceRange) {
          if (parsedParams.priceRange.min !== undefined) {
            apiParams.minPrice = parsedParams.priceRange.min;
          }
          if (parsedParams.priceRange.max !== undefined) {
            apiParams.maxPrice = parsedParams.priceRange.max;
          }
        }

        // Add bedroom filter if available
        if (parsedParams.bedrooms) {
          apiParams.minBedrooms = parsedParams.bedrooms.bedrooms;
          if (!parsedParams.bedrooms.isPlus) {
            apiParams.maxBedrooms = parsedParams.bedrooms.bedrooms;
          }
          console.log('[PropertyBasePage] Bedroom filter applied:', {
            bedrooms: parsedParams.bedrooms.bedrooms,
            isPlus: parsedParams.bedrooms.isPlus,
            minBedrooms: apiParams.minBedrooms,
            maxBedrooms: apiParams.maxBedrooms,
          });
        } else {
          console.log('[PropertyBasePage] No bedroom filter - parsedParams.bedrooms:', parsedParams.bedrooms, 'pageType:', pageType, 'slug:', slug);
        }

        // Add bathroom filter if available
        if (parsedParams.bathrooms) {
          apiParams.minBaths = parsedParams.bathrooms.bathrooms;
          if (!parsedParams.bathrooms.isPlus) {
            apiParams.maxBaths = parsedParams.bathrooms.bathrooms;
          }
          console.log('[PropertyBasePage] Bathroom filter applied:', {
            bathrooms: parsedParams.bathrooms.bathrooms,
            isPlus: parsedParams.bathrooms.isPlus,
            minBaths: apiParams.minBaths,
            maxBaths: apiParams.maxBaths,
          });
        } else {
          console.log('[PropertyBasePage] No bathroom filter - parsedParams.bathrooms:', parsedParams.bathrooms, 'pageType:', pageType, 'slug:', slug);
        }

        // Add square footage filter if available
        if (parsedParams.sqft) {
          if (parsedParams.sqft.min !== undefined) {
            apiParams.minSqft = parsedParams.sqft.min;
          }
          if (parsedParams.sqft.max !== undefined) {
            apiParams.maxSqft = parsedParams.sqft.max;
          }
        }

        // Add year built filter if available
        if (parsedParams.yearBuilt) {
          const currentYear = new Date().getFullYear();
          
          // For age-based filters, calculate year built from years old
          if (parsedParams.yearBuilt.maxYearsOld !== undefined) {
            const minYearBuilt = currentYear - parsedParams.yearBuilt.maxYearsOld;
            apiParams.minYearBuilt = minYearBuilt;
          }
          if (parsedParams.yearBuilt.minYearsOld !== undefined) {
            const maxYearBuilt = currentYear - parsedParams.yearBuilt.minYearsOld;
            apiParams.maxYearBuilt = maxYearBuilt;
          }
          
          // For specific age ranges (like "0-5 years old"), use yearBuilt parameter
          // Note: Some MLSs use age ranges instead of exact years
          if (parsedParams.yearBuilt.maxYearsOld === 5 && parsedParams.yearBuilt.minYearsOld === undefined) {
            // New homes (0-5 years old) - try both approaches
            apiParams.minYearBuilt = currentYear - 5;
          }
        }

        // Add status/time-based filters if available
        if (parsedParams.status) {
          if (parsedParams.status.hours || parsedParams.status.days) {
            const now = new Date();
            const cutoffDate = new Date();
            if (parsedParams.status.hours) {
              cutoffDate.setHours(now.getHours() - parsedParams.status.hours);
            } else if (parsedParams.status.days) {
              cutoffDate.setDate(now.getDate() - parsedParams.status.days);
            }
            // Format as YYYY-MM-DD
            const dateStr = cutoffDate.toISOString().split('T')[0];
            apiParams.minListDate = dateStr;
          }
        }

        // Fetch properties from API
        const result = await RepliersAPI.listings.getFiltered(apiParams);
        const fetchedProperties = result.listings || [];
        
        // Update pagination info from API response
        const apiTotalPages = result.numPages || Math.ceil((result.count || 0) / resultsPerPage);
        const apiTotalResults = result.count || fetchedProperties.length;
        const hasMorePages = page < apiTotalPages;
        
        console.log('[PropertyBasePage] Fetched properties:', {
          count: fetchedProperties.length,
          page,
          total: apiTotalResults,
          totalPages: apiTotalPages,
          hasMore: hasMorePages,
        });
        
        setTotalPages(apiTotalPages);
        setTotalResults(apiTotalResults);
        setHasMore(hasMorePages);

        // Additional client-side filtering for exact matches
        // Note: Don't filter by bathrooms/bedrooms/price/propertyType/sqft/yearBuilt here
        // if the API already filtered by them - only filter by things the API doesn't support
        console.log('[PropertyBasePage] Before client-side filtering:', {
          fetchedCount: fetchedProperties.length,
          parsedParams: {
            bathrooms: parsedParams.bathrooms,
            priceRange: parsedParams.priceRange,
            cityName: parsedParams.cityName,
            bedrooms: parsedParams.bedrooms,
            propertyType: parsedParams.propertyType,
            sqft: parsedParams.sqft,
            feature: parsedParams.feature,
            ownership: parsedParams.ownership,
          },
          filters: {
            listingType: filters.listingType,
          },
          apiParams: {
            minSqft: apiParams.minSqft,
            maxSqft: apiParams.maxSqft,
            minPrice: apiParams.minPrice,
            maxPrice: apiParams.maxPrice,
            propertyType: apiParams.propertyType,
            city: apiParams.city,
            minBaths: apiParams.minBaths,
            maxBaths: apiParams.maxBaths,
            type: apiParams.type, // Sale or Lease
          },
        });
        
        // Only apply client-side filters for things the API doesn't support
        // The API already handles: city, propertyType, price, bedrooms, bathrooms, sqft, yearBuilt, type (Sale/Lease)
        // But we'll also apply client-side filtering for type as a fallback in case API doesn't filter correctly
        let filtered = filterProperties(
          fetchedProperties,
          undefined, // Don't filter by city - API already did
          undefined, // Don't filter by propertyType - API already did
          undefined, // Don't filter by priceRange - API already did
          undefined, // Don't filter by bedrooms - API already did
          undefined, // Don't filter by bathrooms - API already did
          undefined, // Don't filter by sqft - API already did
          parsedParams.lotSize, // API doesn't support lot size
          undefined, // Don't filter by yearBuilt - API already did
          parsedParams.ownership, // API doesn't fully support ownership filters
          parsedParams.feature, // API doesn't support feature filters
          parsedParams.status // Some status filters need client-side
        );
        
        // Filter by location (neighbourhood or intersection) if provided
        if (locationType && locationName) {
          filtered = filtered.filter(property => {
            if (locationType === 'neighbourhood') {
              const propNeighbourhood = property.address?.neighborhood?.toLowerCase() || '';
              const searchNeighbourhood = locationName.toLowerCase();
              return propNeighbourhood === searchNeighbourhood || 
                     propNeighbourhood.includes(searchNeighbourhood) || 
                     searchNeighbourhood.includes(propNeighbourhood);
            } else if (locationType === 'intersection') {
              const propIntersection = property.address?.majorIntersection?.toLowerCase() || '';
              const searchIntersection = locationName.toLowerCase();
              return propIntersection === searchIntersection || 
                     propIntersection.includes(searchIntersection) || 
                     searchIntersection.includes(propIntersection);
            }
            return true;
          });
        }
        
        // Don't filter by listing type here - let the global filters effect handle it

        // Extract province from first property
        const province = filtered.length > 0 
          ? (filtered[0].address?.state || 'ON')
          : 'ON';

        // Build page info
        const title = buildPropertyPageTitle(
          pageType,
          parsedParams.cityName || 'Toronto',
          parsedParams.propertyType,
          parsedParams.priceRange,
          parsedParams.bedrooms,
          parsedParams.bathrooms,
          parsedParams.sqft,
          parsedParams.lotSize,
          parsedParams.yearBuilt,
          parsedParams.ownership,
          parsedParams.feature,
          parsedParams.status
        );

        const description = buildPropertyPageDescription(
          parsedParams.cityName || 'Toronto',
          parsedParams.propertyType,
          parsedParams.priceRange,
          parsedParams.bedrooms,
          parsedParams.bathrooms,
          parsedParams.sqft,
          parsedParams.lotSize,
          parsedParams.yearBuilt,
          parsedParams.ownership,
          parsedParams.feature,
          parsedParams.status,
          filtered.length
        );

        // Build page info (only on initial load)
        if (!append) {
          setPageInfo({
            title,
            numberOfProperties: apiTotalResults, // Use total from API, not filtered count
            province,
            description,
            pagination: {
              currentPage: 1,
              totalPages: apiTotalPages,
              totalResults: apiTotalResults,
              resultsPerPage,
            },
          });
        }

        if (append) {
          // Append new properties to existing ones
          setAllProperties(prev => [...prev, ...filtered]);
        } else {
          // Replace all properties (e.g. initial load or pagination page change)
          setAllProperties(filtered);
          setHasLoadedOnce(true);
        }
        setCurrentPage(page);
        
        // Set properties directly - the global filters effect will apply additional filters if needed
        // But if there are no global filters active, we want to show all filtered properties
        if (append) {
          setProperties(prev => [...prev, ...filtered]);
        } else {
          setProperties(filtered);
        }
        
        console.log('[PropertyBasePage] Properties set:', {
          allPropertiesCount: filtered.length,
          propertiesCount: filtered.length,
          firstProperty: filtered[0] ? {
            mlsNumber: filtered[0].mlsNumber,
            bathrooms: filtered[0].details?.numBathrooms,
            price: filtered[0].listPrice,
          } : null,
        });

        // Extract unique communities
        if (!append) {
          // Only update communities on initial load
          const uniqueCommunities = Array.from(
            new Set(
              filtered
                .map(prop => prop.address?.neighborhood || prop.address?.area)
                .filter(Boolean) as string[]
            )
          ).sort();
          setCommunities(uniqueCommunities);
        } else {
          // Update communities when loading more
          setCommunities(prev => {
            const newCommunities = Array.from(
              new Set([
                ...prev,
                ...filtered
                  .map(prop => prop.address?.neighborhood || prop.address?.area)
                  .filter(Boolean) as string[]
              ])
            ).sort();
            return newCommunities;
          });
        }
      } catch (error) {
        console.error('Error loading property data:', error);
        if (!append) {
          setProperties([]);
          setAllProperties([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, pageType, citySlug, parsedParams, resultsPerPage, filters.location, filters.locationArea, filters.listingType, locationType, locationName, listingType]);

  // Initial fetch properties
  useEffect(() => {
    if (slug) {
      loadProperties(1, false);
    }
  }, [slug, loadProperties]);

  // Load more properties function
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      console.log('[PropertyBasePage] loadMore blocked:', { loadingMore, hasMore });
      return;
    }
    const nextPage = currentPage + 1;
    console.log('[PropertyBasePage] Loading more properties, page:', nextPage, 'currentPage:', currentPage);
    await loadProperties(nextPage, true);
  }, [loadProperties, currentPage, loadingMore, hasMore]);

  // Reset pagination and reload data when filters change
  useEffect(() => {
    // Only trigger if filters actually changed relevant values
    // const filterDeps = [filters.bedrooms, filters.bathrooms, filters.propertyType, filters.minPrice, filters.maxPrice, filters.locationArea, filters.listingType];
    
    // Check if filters changed and reload from API
    if (slug) {
      console.log('[PropertyBasePage] Filters changed, reloading properties from page 1...');
      setCurrentPage(1);
      setHasMore(true);
      setAllProperties([]); // Clear existing properties
      setProperties([]);    // Clear filtered properties view
      loadProperties(1, false); // Reload from API with new filters
    }
  }, [filters.bedrooms, filters.bathrooms, filters.propertyType, filters.minPrice, filters.maxPrice, filters.locationArea, filters.listingType, slug, loadProperties]);

  // Apply additional filters from filter state
  useEffect(() => {
    if (allProperties.length === 0) {
      setProperties([]);
      return;
    }

    let filtered = [...allProperties];

    // Apply price filters from global filters (only if not already filtered by page)
    if (filters.minPrice > 0 && !parsedParams.priceRange) {
      filtered = filtered.filter(prop => prop.listPrice >= filters.minPrice);
    }
    if (filters.maxPrice < 2000000 && !parsedParams.priceRange) {
      filtered = filtered.filter(prop => prop.listPrice <= filters.maxPrice);
    }

    // Apply property type filter (if not already filtered by page type)
    if (filters.propertyType !== 'all' && !parsedParams.propertyType) {
      filtered = filtered.filter(prop => {
        const propType = prop.details?.propertyType?.toLowerCase() || '';
        const filterType = filters.propertyType.toLowerCase();
        return propType.includes(filterType) || propType === filterType;
      });
    }

    // Apply bedroom filter (if not already filtered by page type)
    if (filters.bedrooms > 0 && !parsedParams.bedrooms) {
      filtered = filtered.filter(prop => 
        (prop.details?.numBedrooms || 0) >= filters.bedrooms
      );
    }

    // Apply bathroom filter (if not already filtered by page type)
    if (filters.bathrooms > 0 && !parsedParams.bathrooms) {
      filtered = filtered.filter(prop => 
        (prop.details?.numBathrooms || 0) >= filters.bathrooms
      );
    }

    // Apply location/city filter
    // If a specific city is selected (locationArea), filter by city name
    // The API should already filter by city, but we'll also filter client-side as a fallback
    if (filters.locationArea && filters.locationArea !== 'all') {
      filtered = filtered.filter(prop => {
        const propCity = prop.address?.city?.toLowerCase() || '';
        const propNeighborhood = prop.address?.neighborhood?.toLowerCase() || '';
        const propArea = prop.address?.area?.toLowerCase() || '';
        const filterCity = filters.locationArea.toLowerCase();
        
        // Match if city, neighborhood, or area matches
        return propCity === filterCity ||
               propCity.includes(filterCity) ||
               propNeighborhood === filterCity ||
               propNeighborhood.includes(filterCity) ||
               propArea === filterCity ||
               propArea.includes(filterCity);
      });
    } else if (filters.location && filters.location !== 'all' && !parsedParams.cityName) {
      // If only region is selected (and no URL city), filter by region cities
      const selectedRegion = REGIONS.find(reg => reg.id === filters.location);
      if (selectedRegion) {
        filtered = filtered.filter(prop => {
          const propCity = prop.address?.city?.toLowerCase() || '';
          return selectedRegion.cities.some(city => 
            city.toLowerCase() === propCity || propCity.includes(city.toLowerCase())
          );
        });
      }
    }

    // Apply listing type filter (Sale or Lease)
    if (filters.listingType === 'sell') {
      filtered = filtered.filter(prop => prop.type === 'Sale');
    } else if (filters.listingType === 'rent') {
      filtered = filtered.filter(prop => prop.type === 'Lease');
    }

    setProperties(filtered);
  }, [filters, allProperties, parsedParams]);

  // Handle page change (fetch that page and replace list)
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadProperties(page, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages, loadProperties]);

  // Full-page skeleton only on initial load; filter/page changes keep the layout
  const initialLoading = loading && !hasLoadedOnce;

  return {
    properties,
    allProperties,
    loading,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    pageInfo,
    communities,
    parsedParams,
    pagination: {
      currentPage,
      totalPages,
      totalResults,
      resultsPerPage,
      onPageChange: handlePageChange,
    },
  };
};

