"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreConItem from '@/components/PreConItem/PreConItem';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';
import { preConCities } from '@/components/PreCon/Search/preConSearchData';
import { parseUrlSegments } from '@/lib/utils/urlSegmentParser';
import { parseUrlSegments as parseLocationSegments } from '@/lib/utils/locationDetection';
import { isZipcodeSegment, formatZipcodeForDisplay, normalizeZipcodeForApi } from '@/lib/utils/zipcode';
import { 
  parseBedroomSlug, 
  parseBathroomSlug,
  parsePriceRangeSlug,
  parseSqftSlug,
} from '@/components/Properties/PropertyBasePage/utils';
import { unslugifyCityName } from '@/components/PreCon/PreConstructionBasePage/utils';

const PreConPage: React.FC = () => {
  const params = useParams();
  let segments = (params?.segments as string[]) || [];
  
  // Handle middleware rewrite: if first segment is "_filter", remove it
  // This allows middleware to rewrite /pre-con/city/filter to /pre-con/_filter/city/filter
  // to prevent it from matching [slug]/[unitId]
  if (segments.length > 0 && segments[0] === '_filter') {
    segments = segments.slice(1);
    console.log('[PreConPage] Detected middleware rewrite, removing _filter prefix:', segments);
  }
  const [pageType, setPageType] = useState<'project' | 'by-location' | 'status' | 'propertyType' | 'subPropertyType' | 'completionYear' | 'loading'>('loading');
  const [locationType, setLocationType] = useState<'city' | 'neighbourhood' | 'intersection' | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [zipcode, setZipcode] = useState<string | null>(null);
  const [bedroomFilter, setBedroomFilter] = useState<{ bedrooms: number; isPlus: boolean } | null>(null);
  const [bathroomFilter, setBathroomFilter] = useState<{ bathrooms: number; isPlus: boolean } | null>(null);
  const [priceRangeFilter, setPriceRangeFilter] = useState<{ min?: number; max?: number; label: string } | null>(null);
  const [sqftFilter, setSqftFilter] = useState<{ min?: number; max?: number; label: string } | null>(null);

  // Known city slugs (from preConCities)
  const knownCitySlugs = preConCities.map(city => city.id);

  // Known status slugs
  const knownStatusSlugs = ['selling', 'coming-soon', 'sold-out'];

  // Known property type slugs
  const knownPropertyTypeSlugs = ['condos', 'houses', 'lofts', 'master-planned-communities', 'multi-family', 'offices'];

  // Known sub-property type slugs (format: subType-mainType)
  const knownSubPropertyTypeSlugs = [
    'high-rise-condos',
    'mid-rise-condos',
    'low-rise-condos',
    'link-houses',
    'townhouse-houses',
    'semi-detached-houses',
    'detached-houses',
  ];

  // Helper to check if slug is a sub-property type
  const isSubPropertyType = (slug: string): boolean => {
    return knownSubPropertyTypeSlugs.includes(slug.toLowerCase());
  };

  // Helper to check if slug is a year (4-digit number)
  const isYear = (slug: string): boolean => {
    if (!slug) return false;
    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(slug)) {
      console.log('[PreConPage] isYear check failed - not 4 digits:', slug);
      return false;
    }
    const year = parseInt(slug, 10);
    // Check if it's a reasonable year (e.g., 2020-2100)
    const isValid = year >= 2020 && year <= 2100;
    console.log('[PreConPage] isYear check:', { slug, year, isValid });
    return isValid;
  };

  useEffect(() => {
    const determinePageType = async () => {
      try {
        console.log('[PreConPage] Determining page type for segments:', segments);
        
        // If no segments, show base page
        if (segments.length === 0) {
          setZipcode(null);
          setPageType('by-location');
          return;
        }

        const parsed = parseUrlSegments(segments);
        const firstSegment = segments[0]?.toLowerCase() || '';
        const secondSegment = segments[1]?.toLowerCase() || '';

        console.log('[PreConPage] Segments:', {
          firstSegment,
          secondSegment,
          isKnownCity: knownCitySlugs.includes(firstSegment),
          isYear: isYear(secondSegment),
          zipcode: parsed.zipcode,
        });

        // Check if first segment is a zipcode/postal code
        if (segments[0] && isZipcodeSegment(segments[0])) {
          setZipcode(normalizeZipcodeForApi(segments[0]));
          setLocationName(formatZipcodeForDisplay(segments[0]));
          setLocationType('city');
          setPageType('by-location');
          return;
        }

        setZipcode(null);

        // Check if first segment is a known city
        if (knownCitySlugs.includes(firstSegment)) {
          // Determine if there's a location (neighbourhood/intersection)
          if (parsed.locationName) {
            const locationInfo = await parseLocationSegments(
              segments.slice(1),
              segments[0]
            );
            setLocationType(locationInfo.locationType);
            setLocationName(locationInfo.locationName);
            
            // Parse all filters from URL segments
            if (parsed.filters.length > 0) {
              for (const filter of parsed.filters) {
                const bedrooms = parseBedroomSlug(filter);
                const bathrooms = parseBathroomSlug(filter);
                const priceRange = parsePriceRangeSlug(filter);
                const sqft = parseSqftSlug(filter);
                
                if (bedrooms) {
                  setBedroomFilter(bedrooms);
                }
                if (bathrooms) {
                  setBathroomFilter(bathrooms);
                }
                if (priceRange) {
                  setPriceRangeFilter(priceRange);
                }
                if (sqft) {
                  setSqftFilter(sqft);
                }
              }
            }
            
            setPageType('by-location');
            return;
          }

          // Check if second segment is a filter
          if (segments.length > 1) {
            const secondSegment = segments[1]?.toLowerCase() || '';
            
            // PRIORITY: Check if it's a year FIRST (before other filters)
            // This ensures year pages are detected correctly
            if (isYear(secondSegment)) {
              console.log('[PreConPage] Detected completionYear page with city:', {
                city: firstSegment,
                year: secondSegment,
                segments,
              });
              setPageType('completionYear');
              // Set location info for city + completionYear pages
              const cityName = unslugifyCityName(firstSegment);
              setLocationType('city');
              setLocationName(cityName);
              return;
            }
            
            // Parse all filters from URL segments
            // Check all filter types in order of priority
            for (let i = 1; i < segments.length; i++) {
              const filterSegment = segments[i]?.toLowerCase() || '';
              
              // Skip if it's a known property type, status, or sub-property type
              if (knownPropertyTypeSlugs.includes(filterSegment) || 
                  knownStatusSlugs.includes(filterSegment) || 
                  isSubPropertyType(filterSegment)) {
                continue;
              }
              
              const bedrooms = parseBedroomSlug(filterSegment);
              const bathrooms = parseBathroomSlug(filterSegment);
              const priceRange = parsePriceRangeSlug(filterSegment);
              const sqft = parseSqftSlug(filterSegment);
              
              if (bedrooms) {
                setBedroomFilter(bedrooms);
              }
              if (bathrooms) {
                setBathroomFilter(bathrooms);
              }
              if (priceRange) {
                setPriceRangeFilter(priceRange);
              }
              if (sqft) {
                setSqftFilter(sqft);
              }
            }
            
            // Check if second segment is a bedroom filter
            const bedrooms = parseBedroomSlug(secondSegment);
            if (bedrooms) {
              setPageType('by-location');
              return;
            }
            
            // Check if second segment is a bathroom filter
            const bathrooms = parseBathroomSlug(secondSegment);
            if (bathrooms) {
              setPageType('by-location');
              return;
            }
            
            // Check if second segment is a price range filter
            const priceRange = parsePriceRangeSlug(secondSegment);
            if (priceRange) {
              setPageType('by-location');
              return;
            }
            
            // Check if second segment is a sqft filter
            const sqft = parseSqftSlug(secondSegment);
            if (sqft) {
              setPageType('by-location');
              return;
            }

            // Check if it's a sub-property type
            if (isSubPropertyType(secondSegment)) {
              setPageType('subPropertyType');
              return;
            }

            // Check if it's a known status
            if (knownStatusSlugs.includes(secondSegment)) {
              setPageType('status');
              return;
            }

            // Check if it's a known property type
            if (knownPropertyTypeSlugs.includes(secondSegment)) {
              setPageType('propertyType');
              return;
            }
          }

          // Default to by-location for city
          setPageType('by-location');
          return;
        }

        // Check if first segment is a year
        if (isYear(firstSegment)) {
          console.log('[PreConPage] Detected completionYear page (no city):', firstSegment);
          setPageType('completionYear');
          return;
        }

        // Check if first segment is a sub-property type
        if (isSubPropertyType(firstSegment)) {
          setPageType('subPropertyType');
          return;
        }

        // Check if first segment is a known status
        if (knownStatusSlugs.includes(firstSegment)) {
          setPageType('status');
          return;
        }

        // Check if first segment is a known property type
        if (knownPropertyTypeSlugs.includes(firstSegment)) {
          setPageType('propertyType');
          return;
        }

        // If not a known filter, try to fetch as a project (by mlsNumber)
        // BUT first check if second segment could be a year (for unknown cities)
        if (segments.length > 1 && isYear(segments[1]?.toLowerCase() || '')) {
          console.log('[PreConPage] Detected completionYear page (unknown city):', {
            city: firstSegment,
            year: segments[1],
          });
          const cityName = unslugifyCityName(firstSegment);
          setLocationType('city');
          setLocationName(cityName);
          setPageType('completionYear');
          return;
        }

        const projectSlug = segments.join('/');
        console.log('[PreConPage] Trying to fetch as project:', projectSlug);
        const projectResponse = await fetch(`/api/pre-con-projects/${projectSlug}`);
        
        if (projectResponse.ok) {
          // It's a project
          console.log('[PreConPage] Found as project');
          setPageType('project');
        } else {
          // Not found as project, but could still be a city (dynamic city names)
          // Check if we can fetch projects for this city
          const cityName = firstSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const cityResponse = await fetch(`/api/v1/pre-con-projects?city=${encodeURIComponent(cityName)}`);
          
          if (cityResponse.ok) {
            const data = await cityResponse.json();
            // Handle v1 API response format: { success, data: { projects }, meta }
            // or fallback to old format: { projects }
            const projects = data.success && data.data
              ? (data.data.projects || [])
              : (data.projects || []);
            // If we get projects back, treat it as a location
            if (projects && projects.length > 0) {
              setPageType('by-location');
            } else {
              // No projects found, but still treat as location (empty location page)
              setPageType('by-location');
            }
          } else {
            // Not a city either, default to project (will show 404 if not found)
            setPageType('project');
          }
        }
      } catch (error) {
        console.error('Error determining page type:', error);
        // Default to project on error
        setPageType('project');
      }
    };

    determinePageType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, knownCitySlugs]);

  // Show loading state
  if (pageType === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate page based on type
  console.log('[PreConPage] Rendering with pageType:', pageType, 'segments:', segments);
  
  if (pageType === 'by-location' || pageType === 'status' || pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
    // Build slug based on pageType
    // Extract city info if first segment is a city
    const firstSegment = segments[0]?.toLowerCase() || '';
    const isCityPage = knownCitySlugs.includes(firstSegment);
    const citySlug = isCityPage ? segments[0] : null;
    
    let slug = '';
    if (pageType === 'propertyType' || pageType === 'subPropertyType') {
      // For property type pages, extract just the property type segment
      // If it's a city + propertyType (e.g., toronto/condos), use just the property type part
      if (isCityPage && segments.length > 1) {
        // City + propertyType: extract the property type segment
        slug = segments.slice(1).join('/');
      } else {
        // Just propertyType: use all segments
        slug = segments.join('/');
      }
    } else if (pageType === 'status') {
      // For status pages, extract just the status segment
      if (isCityPage && segments.length > 1) {
        slug = segments.slice(1).join('/');
      } else {
        slug = segments.join('/');
      }
    } else if (pageType === 'completionYear') {
      // For completion year pages, extract just the year segment
      if (isCityPage && segments.length > 1) {
        slug = segments.slice(1).join('/');
      } else {
        slug = segments.join('/');
      }
    } else {
      // For by-location, use full slug
      slug = segments.length > 0 ? segments.join('/') : '';
    }
    
    // Pass city info if available for propertyType/status/completionYear pages
    // This allows the hook to combine city + propertyType filters
    const finalLocationType = pageType === 'by-location' ? locationType : (isCityPage ? 'city' : null);
    const finalLocationName = pageType === 'by-location' ? locationName : (isCityPage ? unslugifyCityName(citySlug || '') : null);
    
    return (
      <PreConstructionBasePage 
        slug={slug} 
        pageType={pageType}
        locationType={finalLocationType}
        locationName={finalLocationName}
        zipcode={zipcode}
        bedroomFilter={bedroomFilter}
        bathroomFilter={bathroomFilter}
        priceRangeFilter={priceRangeFilter}
        sqftFilter={sqftFilter}
      />
    );
  }

  // Otherwise, it's a project
  console.log('[PreConPage] Rendering as project page (pageType:', pageType, ')');
  return <PreConItem />;
};

export default PreConPage;

