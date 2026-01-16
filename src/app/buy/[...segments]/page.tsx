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
      title = `Homes for Sale in ${locationName}, ${cityName}`;
      description = `Find homes for sale in ${locationName}, ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
    } else {
      // Handle filters
      const firstFilter = parsed.filters[0];
      const priceRange = parsePriceRangeSlug(firstFilter);
      const bedrooms = parseBedroomSlug(firstFilter);
      const bathrooms = parseBathroomSlug(firstFilter);
      const propertyType = formatPropertyType(firstFilter);

      if (priceRange) {
        title = `Homes for Sale in ${locationName}, ${cityName} ${priceRange.label}`;
        description = `Find homes for sale in ${locationName}, ${cityName} ${priceRange.label.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
      } else if (bedrooms) {
        const bedroomLabel = formatBedrooms(bedrooms.bedrooms, bedrooms.isPlus);
        title = `${bedroomLabel} Homes for Sale in ${locationName}, ${cityName}`;
        description = `Find ${bedroomLabel.toLowerCase()} homes for sale in ${locationName}, ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
      } else if (bathrooms) {
        const bathroomLabel = formatBathrooms(bathrooms.bathrooms, bathrooms.isPlus);
        title = `${bathroomLabel} Homes for Sale in ${locationName}, ${cityName}`;
        description = `Find ${bathroomLabel.toLowerCase()} homes for sale in ${locationName}, ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
      } else {
        title = `${propertyType} for Sale in ${locationName}, ${cityName}`;
        description = `Find ${propertyType.toLowerCase()} for sale in ${locationName}, ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
      }
    }
  } else if (parsed.locationType === 'intersection' || locationType === 'intersection') {
    const locationName = parsed.locationName || '';
    if (parsed.filters.length === 0) {
      title = `Homes for Sale near ${locationName}, ${cityName}`;
      description = `Find homes for sale near ${locationName}, ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
    } else {
      const firstFilter = parsed.filters[0];
      const priceRange = parsePriceRangeSlug(firstFilter);
      if (priceRange) {
        title = `Homes for Sale near ${locationName}, ${cityName} ${priceRange.label}`;
        description = `Find homes for sale near ${locationName}, ${cityName} ${priceRange.label.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
      } else {
        title = `Homes for Sale near ${locationName}, ${cityName}`;
        description = `Find homes for sale near ${locationName}, ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
      }
    }
  } else {
    // City-level page
    if (parsed.filters.length === 0) {
      title = `Homes for Sale in ${cityName}`;
      description = `Find homes for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
    } else {
      const firstFilter = parsed.filters[0];
      const priceRange = parsePriceRangeSlug(firstFilter);
      const bedrooms = parseBedroomSlug(firstFilter);
      const bathrooms = parseBathroomSlug(firstFilter);
      const propertyType = formatPropertyType(firstFilter);

      if (priceRange) {
        title = `Homes for Sale in ${cityName} ${priceRange.label}`;
        description = `Find homes for sale in ${cityName} ${priceRange.label.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
      } else if (bedrooms) {
        const bedroomLabel = formatBedrooms(bedrooms.bedrooms, bedrooms.isPlus);
        title = `${bedroomLabel} Homes for Sale in ${cityName}`;
        description = `Find ${bedroomLabel.toLowerCase()} homes for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
      } else if (bathrooms) {
        const bathroomLabel = formatBathrooms(bathrooms.bathrooms, bathrooms.isPlus);
        title = `${bathroomLabel} Homes for Sale in ${cityName}`;
        description = `Find ${bathroomLabel.toLowerCase()} homes for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
      } else {
        title = `${propertyType} for Sale in ${cityName}`;
        description = `Find ${propertyType.toLowerCase()} for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
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

export default async function BuyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsed = parseUrlSegments(resolvedParams.segments);

  // Determine actual location type (neighbourhood vs intersection)
  let actualLocationType = parsed.locationType;
  if (parsed.locationName) {
    const locationInfo = await parseLocationSegments(
      resolvedParams.segments.slice(1),
      resolvedParams.segments[0]
    );
    actualLocationType = locationInfo.locationType;
  }

  // Build combined slug for PropertyBasePage
  // If we have a location, we need to pass it differently
  // For now, we'll use the filters as the slug and handle location in the component
  const combinedSlug = parsed.filters.length > 0 
    ? parsed.filters.join('-')
    : parsed.locationName 
      ? parsed.locationName.toLowerCase().replace(/\s+/g, '-')
      : parsed.city.toLowerCase().replace(/\s+/g, '-');

  return (
    <PropertyBasePage
      slug={combinedSlug}
      pageType={parsed.pageType}
      citySlug={resolvedParams.segments[0]}
      listingType="sell"
      locationType={actualLocationType}
      locationName={parsed.locationName}
    />
  );
}

