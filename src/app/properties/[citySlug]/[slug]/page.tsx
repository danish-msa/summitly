import PropertyBasePage from '@/components/Properties/PropertyBasePage/PropertyBasePage';
import type { Metadata } from 'next';
import { 
  unslugifyCityName, 
  formatPropertyType, 
  parsePriceRangeSlug,
  parseBedroomSlug,
  parseBathroomSlug,
  parseSqftSlug,
  parseLotSizeSlug,
  parseYearBuiltSlug,
  parseOwnershipSlug,
  parseFeatureSlug,
  parseStatusSlug,
  formatBedrooms,
  formatBathrooms,
  slugToPropertyType,
  buildPropertyPageTitle,
  buildPropertyPageDescription,
} from '@/components/Properties/PropertyBasePage/utils';

interface PageProps {
  params: Promise<{
    citySlug: string;
    slug: string;
  }>;
}

function determinePageType(slug: string): {
  pageType: 'propertyType' | 'price-range' | 'bedrooms' | 'bathrooms' | 'sqft' | 'lot-size' | 'year-built' | 'ownership' | 'feature' | 'status';
  propertyType?: string;
  priceRange?: { min?: number; max?: number; label: string };
  bedrooms?: { bedrooms: number; isPlus: boolean };
  bathrooms?: { bathrooms: number; isPlus: boolean };
  sqft?: { min?: number; max?: number; label: string };
  lotSize?: { min?: number; max?: number; label: string; unit: 'acres' | 'sqft' };
  yearBuilt?: { minYearsOld?: number; maxYearsOld?: number; type?: string; label: string };
  ownership?: { ownership?: string; propertyType?: string; maxFee?: number; amenities?: boolean; label: string };
  feature?: { feature: string; label: string };
  status?: { type?: string; hours?: number; days?: number; label: string };
} {
  // Check if it's a status/time-based filter (check first as it's most specific)
  const status = parseStatusSlug(slug);
  if (status) {
    return { pageType: 'status', status };
  }

  // Check if it's a price range
  const priceRange = parsePriceRangeSlug(slug);
  if (priceRange) {
    return { pageType: 'price-range', priceRange };
  }

  // Check if it's a bedroom count
  const bedrooms = parseBedroomSlug(slug);
  if (bedrooms) {
    return { pageType: 'bedrooms', bedrooms };
  }

  // Check if it's a bathroom count
  const bathrooms = parseBathroomSlug(slug);
  if (bathrooms) {
    return { pageType: 'bathrooms', bathrooms };
  }

  // Check if it's a square footage filter
  const sqft = parseSqftSlug(slug);
  if (sqft) {
    return { pageType: 'sqft', sqft };
  }

  // Check if it's a lot size filter
  const lotSize = parseLotSizeSlug(slug);
  if (lotSize) {
    return { pageType: 'lot-size', lotSize };
  }

  // Check if it's a year built/age filter
  const yearBuilt = parseYearBuiltSlug(slug);
  if (yearBuilt) {
    return { pageType: 'year-built', yearBuilt };
  }

  // Check if it's an ownership/fee structure filter
  const ownership = parseOwnershipSlug(slug);
  if (ownership) {
    return { pageType: 'ownership', ownership };
  }

  // Check if it's a feature-based filter
  const feature = parseFeatureSlug(slug);
  if (feature) {
    return { pageType: 'feature', feature };
  }

  // Otherwise, it's a property type
  const propertyType = slugToPropertyType(slug);
  return { pageType: 'propertyType', propertyType };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cityName = unslugifyCityName(resolvedParams.citySlug);
  const pageInfo = determinePageType(resolvedParams.slug);
  
  let title = '';
  let description = '';

  if (pageInfo.pageType === 'propertyType') {
    const propertyTypeDisplay = formatPropertyType(resolvedParams.slug);
    title = `${propertyTypeDisplay} for Sale in ${cityName}`;
    description = `Find ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'price-range' && pageInfo.priceRange) {
    title = `Homes for Sale in ${cityName} ${pageInfo.priceRange.label}`;
    description = `Find homes for sale in ${cityName} ${pageInfo.priceRange.label.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'bedrooms' && pageInfo.bedrooms) {
    const bedroomLabel = formatBedrooms(pageInfo.bedrooms.bedrooms, pageInfo.bedrooms.isPlus);
    title = `${bedroomLabel} Homes for Sale in ${cityName}`;
    description = `Find ${bedroomLabel.toLowerCase()} homes for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'bathrooms' && pageInfo.bathrooms) {
    const bathroomLabel = formatBathrooms(pageInfo.bathrooms.bathrooms, pageInfo.bathrooms.isPlus);
    title = `${bathroomLabel} Homes for Sale in ${cityName}`;
    description = `Find ${bathroomLabel.toLowerCase()} homes for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'sqft' && pageInfo.sqft) {
    title = buildPropertyPageTitle('sqft', cityName, undefined, undefined, undefined, undefined, pageInfo.sqft);
    description = buildPropertyPageDescription(cityName, undefined, undefined, undefined, undefined, pageInfo.sqft, undefined, undefined, undefined, undefined, undefined, 0);
  } else if (pageInfo.pageType === 'lot-size' && pageInfo.lotSize) {
    title = buildPropertyPageTitle('lot-size', cityName, undefined, undefined, undefined, undefined, undefined, pageInfo.lotSize);
    description = buildPropertyPageDescription(cityName, undefined, undefined, undefined, undefined, undefined, pageInfo.lotSize, undefined, undefined, undefined, undefined, 0);
  } else if (pageInfo.pageType === 'year-built' && pageInfo.yearBuilt) {
    title = buildPropertyPageTitle('year-built', cityName, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.yearBuilt);
    description = buildPropertyPageDescription(cityName, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.yearBuilt, undefined, undefined, undefined, 0);
  } else if (pageInfo.pageType === 'ownership' && pageInfo.ownership) {
    title = buildPropertyPageTitle('ownership', cityName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.ownership);
    description = buildPropertyPageDescription(cityName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.ownership, undefined, undefined, 0);
  } else if (pageInfo.pageType === 'feature' && pageInfo.feature) {
    title = buildPropertyPageTitle('feature', cityName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.feature);
    description = buildPropertyPageDescription(cityName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.feature, undefined, 0);
  } else if (pageInfo.pageType === 'status' && pageInfo.status) {
    title = buildPropertyPageTitle('status', cityName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.status);
    description = buildPropertyPageDescription(cityName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pageInfo.status, 0);
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

export default async function PropertyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const pageInfo = determinePageType(resolvedParams.slug);
  
  return (
    <PropertyBasePage
      slug={resolvedParams.slug}
      pageType={pageInfo.pageType}
      citySlug={resolvedParams.citySlug}
    />
  );
}

