import PropertyBasePage from '@/components/Properties/PropertyBasePage/PropertyBasePage';
import type { Metadata } from 'next';
import { parseUrlSegments } from '@/lib/utils/urlSegmentParser';
import { parseUrlSegments as parseLocationSegments } from '@/lib/utils/locationDetection';
import { 
  formatPropertyType,
  parsePriceRangeSlug,
  parseBedroomSlug,
  parseBathroomSlug,
  formatBedrooms,
  formatBathrooms,
} from '@/components/Properties/PropertyBasePage/utils';

interface PageProps {
  params: Promise<{
    segments: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const parsed = parseUrlSegments(resolvedParams.segments);
  
  // Determine location type (neighbourhood vs intersection)
  let locationType: 'city' | 'neighbourhood' | 'intersection' = 'city';
  if (parsed.locationName) {
    const locationInfo = await parseLocationSegments(
      resolvedParams.segments.slice(1),
      resolvedParams.segments[0]
    );
    locationType = locationInfo.locationType || 'city';
  }

  const cityName = parsed.city;
  let title = '';
  let description = '';

  // Build title and description based on location and filters
  if (parsed.locationType === 'neighbourhood' || locationType === 'neighbourhood') {
    const locationName = parsed.locationName || '';
    if (parsed.filters.length === 0) {
      title = `Homes for Rent in ${locationName}, ${cityName}`;
      description = `Find homes for rent in ${locationName}, ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
    } else {
      // Handle filters
      const firstFilter = parsed.filters[0];
      const priceRange = parsePriceRangeSlug(firstFilter);
      const bedrooms = parseBedroomSlug(firstFilter);
      const bathrooms = parseBathroomSlug(firstFilter);
      const propertyType = formatPropertyType(firstFilter);

      if (priceRange) {
        title = `Homes for Rent in ${locationName}, ${cityName} ${priceRange.label}`;
        description = `Find homes for rent in ${locationName}, ${cityName} ${priceRange.label.toLowerCase()}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else if (bedrooms) {
        const bedroomLabel = formatBedrooms(bedrooms.bedrooms, bedrooms.isPlus);
        title = `${bedroomLabel} Homes for Rent in ${locationName}, ${cityName}`;
        description = `Find ${bedroomLabel.toLowerCase()} homes for rent in ${locationName}, ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else if (bathrooms) {
        const bathroomLabel = formatBathrooms(bathrooms.bathrooms, bathrooms.isPlus);
        title = `${bathroomLabel} Homes for Rent in ${locationName}, ${cityName}`;
        description = `Find ${bathroomLabel.toLowerCase()} homes for rent in ${locationName}, ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else {
        title = `${propertyType} for Rent in ${locationName}, ${cityName}`;
        description = `Find ${propertyType.toLowerCase()} for rent in ${locationName}, ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      }
    }
  } else if (parsed.locationType === 'intersection' || locationType === 'intersection') {
    const locationName = parsed.locationName || '';
    if (parsed.filters.length === 0) {
      title = `Homes for Rent near ${locationName}, ${cityName}`;
      description = `Find homes for rent near ${locationName}, ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
    } else {
      const firstFilter = parsed.filters[0];
      const priceRange = parsePriceRangeSlug(firstFilter);
      if (priceRange) {
        title = `Homes for Rent near ${locationName}, ${cityName} ${priceRange.label}`;
        description = `Find homes for rent near ${locationName}, ${cityName} ${priceRange.label.toLowerCase()}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else {
        title = `Homes for Rent near ${locationName}, ${cityName}`;
        description = `Find homes for rent near ${locationName}, ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      }
    }
  } else {
    // City-level page
    if (parsed.filters.length === 0) {
      title = `Homes for Rent in ${cityName}`;
      description = `Find homes for rent in ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
    } else {
      const firstFilter = parsed.filters[0];
      const priceRange = parsePriceRangeSlug(firstFilter);
      const bedrooms = parseBedroomSlug(firstFilter);
      const bathrooms = parseBathroomSlug(firstFilter);
      const propertyType = formatPropertyType(firstFilter);

      if (priceRange) {
        title = `Homes for Rent in ${cityName} ${priceRange.label}`;
        description = `Find homes for rent in ${cityName} ${priceRange.label.toLowerCase()}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else if (bedrooms) {
        const bedroomLabel = formatBedrooms(bedrooms.bedrooms, bedrooms.isPlus);
        title = `${bedroomLabel} Homes for Rent in ${cityName}`;
        description = `Find ${bedroomLabel.toLowerCase()} homes for rent in ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else if (bathrooms) {
        const bathroomLabel = formatBathrooms(bathrooms.bathrooms, bathrooms.isPlus);
        title = `${bathroomLabel} Homes for Rent in ${cityName}`;
        description = `Find ${bathroomLabel.toLowerCase()} homes for rent in ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      } else {
        title = `${propertyType} for Rent in ${cityName}`;
        description = `Find ${propertyType.toLowerCase()} for rent in ${cityName}. Browse rental listings, view photos, and connect with real estate agents.`;
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function RentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsed = parseUrlSegments(resolvedParams.segments);

  console.log('[RentPage] Parsed segments:', {
    segments: resolvedParams.segments,
    parsed,
  });

  // Determine actual location type (neighbourhood vs intersection)
  let actualLocationType = parsed.locationType;
  let actualLocationName = parsed.locationName;
  
  if (parsed.locationName && resolvedParams.segments.length > 1) {
    const locationInfo = await parseLocationSegments(
      resolvedParams.segments.slice(1),
      resolvedParams.segments[0]
    );
    actualLocationType = locationInfo.locationType;
    // Use the locationName from locationInfo - it has the correct format from the API
    // This ensures the neighbourhood name matches what's in the database
    actualLocationName = locationInfo.locationName || parsed.locationName;
    
    console.log('[RentPage] Location detection result:', {
      segments: resolvedParams.segments,
      parsedLocationName: parsed.locationName,
      locationInfo,
      actualLocationType,
      actualLocationName,
    });
  }

  // Build combined slug for PropertyBasePage
  const combinedSlug = parsed.filters.length > 0 
    ? parsed.filters.join('-')
    : parsed.locationName 
      ? parsed.locationName.toLowerCase().replace(/\s+/g, '-')
      : parsed.city.toLowerCase().replace(/\s+/g, '-');

  console.log('[RentPage] Final props:', {
    slug: combinedSlug,
    pageType: parsed.pageType,
    citySlug: resolvedParams.segments[0],
    listingType: 'rent',
    locationType: actualLocationType,
    locationName: actualLocationName,
  });

  return (
    <PropertyBasePage
      slug={combinedSlug}
      pageType={parsed.pageType}
      citySlug={resolvedParams.segments[0]}
      listingType="rent"
      locationType={actualLocationType}
      locationName={actualLocationName}
    />
  );
}

