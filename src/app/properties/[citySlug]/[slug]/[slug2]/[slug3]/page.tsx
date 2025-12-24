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
    slug2: string;
    slug3: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cityName = unslugifyCityName(resolvedParams.citySlug);
  
  // Parse all possible filter types for slug3
  const bedroomInfo = parseBedroomSlug(resolvedParams.slug3);
  const bathroomInfo = parseBathroomSlug(resolvedParams.slug3);
  const sqftInfo = parseSqftSlug(resolvedParams.slug3);
  const featureInfo = parseFeatureSlug(resolvedParams.slug3);
  
  const propertyTypeDisplay = formatPropertyType(resolvedParams.slug);
  const priceInfo = parsePriceRangeSlug(resolvedParams.slug2);
  const priceLabel = priceInfo?.label || resolvedParams.slug2;
  
  let title = '';
  let description = '';
  
  if (bedroomInfo) {
    // propertyType-price-bedrooms
    const bedroomLabel = formatBedrooms(bedroomInfo.bedrooms, bedroomInfo.isPlus);
    title = `${bedroomLabel} ${propertyTypeDisplay} for Sale in ${cityName} ${priceLabel}`;
    description = `Find ${bedroomLabel.toLowerCase()} ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName} ${priceLabel.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (bathroomInfo) {
    // propertyType-price-bathrooms
    const bathroomLabel = formatBathrooms(bathroomInfo.bathrooms, bathroomInfo.isPlus);
    title = `${bathroomLabel} ${propertyTypeDisplay} for Sale in ${cityName} ${priceLabel}`;
    description = `Find ${bathroomLabel.toLowerCase()} ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName} ${priceLabel.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (sqftInfo) {
    // propertyType-price-sqft
    title = buildPropertyPageTitle('propertyType-price-sqft', cityName, resolvedParams.slug, priceInfo, undefined, undefined, sqftInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, priceInfo, undefined, undefined, sqftInfo);
  } else if (featureInfo) {
    // propertyType-price-feature
    title = buildPropertyPageTitle('propertyType-price-feature', cityName, resolvedParams.slug, priceInfo, undefined, undefined, undefined, undefined, undefined, undefined, featureInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, priceInfo, undefined, undefined, undefined, undefined, undefined, undefined, featureInfo);
  } else {
    // Fallback (shouldn't happen, but just in case)
    title = `${propertyTypeDisplay} for Sale in ${cityName} ${priceLabel}`;
    description = `Find ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName} ${priceLabel.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
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

export default async function PropertyFullCombinedPage({ params }: PageProps) {
  const resolvedParams = await params;
  // Combine all three slugs
  const combinedSlug = `${resolvedParams.slug}-${resolvedParams.slug2}-${resolvedParams.slug3}`;
  
  // Determine if slug3 is bedrooms, bathrooms, sqft, or feature
  const bedroomInfo = parseBedroomSlug(resolvedParams.slug3);
  const bathroomInfo = parseBathroomSlug(resolvedParams.slug3);
  const sqftInfo = parseSqftSlug(resolvedParams.slug3);
  const featureInfo = parseFeatureSlug(resolvedParams.slug3);
  
  const pageType = bedroomInfo 
    ? 'propertyType-price-bedrooms' 
    : bathroomInfo 
    ? 'propertyType-price-bathrooms' 
    : sqftInfo
    ? 'propertyType-price-sqft'
    : featureInfo
    ? 'propertyType-price-feature'
    : 'propertyType-price-bedrooms'; // Default fallback
  
  return (
    <PropertyBasePage
      slug={combinedSlug}
      pageType={pageType}
      citySlug={resolvedParams.citySlug}
    />
  );
}

