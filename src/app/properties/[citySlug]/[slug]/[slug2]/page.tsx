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
  }>;
}

function determinePageType(slug1: string, slug2: string): {
  pageType: 'propertyType-price' | 'propertyType-bedrooms' | 'propertyType-bathrooms' | 'propertyType-sqft' | 'propertyType-lot-size' | 'propertyType-year-built' | 'propertyType-ownership' | 'propertyType-feature' | 'price-bedrooms' | 'price-bathrooms' | 'price-sqft' | 'price-lot-size' | 'price-year-built' | 'price-feature';
  combinedSlug: string;
} {
  // Check if slug1 is a property type
  const propertyType1 = slugToPropertyType(slug1);
  const isPropertyType1 = propertyType1 !== slug1.toLowerCase();
  
  // Check if slug1 is a price range
  const priceRange1 = parsePriceRangeSlug(slug1);
  
  // Parse slug2 for all possible filter types
  const priceRange2 = parsePriceRangeSlug(slug2);
  const bedrooms2 = parseBedroomSlug(slug2);
  const bathrooms2 = parseBathroomSlug(slug2);
  const sqft2 = parseSqftSlug(slug2);
  const lotSize2 = parseLotSizeSlug(slug2);
  const yearBuilt2 = parseYearBuiltSlug(slug2);
  const ownership2 = parseOwnershipSlug(slug2);
  const feature2 = parseFeatureSlug(slug2);

  // Property Type + Filter combinations
  if (isPropertyType1 && priceRange2) {
    return { pageType: 'propertyType-price', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && bedrooms2) {
    return { pageType: 'propertyType-bedrooms', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && bathrooms2) {
    return { pageType: 'propertyType-bathrooms', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && sqft2) {
    return { pageType: 'propertyType-sqft', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && lotSize2) {
    return { pageType: 'propertyType-lot-size', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && yearBuilt2) {
    return { pageType: 'propertyType-year-built', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && ownership2) {
    return { pageType: 'propertyType-ownership', combinedSlug: `${slug1}-${slug2}` };
  } else if (isPropertyType1 && feature2) {
    return { pageType: 'propertyType-feature', combinedSlug: `${slug1}-${slug2}` };
  }
  
  // Price Range + Filter combinations
  else if (priceRange1 && bedrooms2) {
    return { pageType: 'price-bedrooms', combinedSlug: `${slug1}-${slug2}` };
  } else if (priceRange1 && bathrooms2) {
    return { pageType: 'price-bathrooms', combinedSlug: `${slug1}-${slug2}` };
  } else if (priceRange1 && sqft2) {
    return { pageType: 'price-sqft', combinedSlug: `${slug1}-${slug2}` };
  } else if (priceRange1 && lotSize2) {
    return { pageType: 'price-lot-size', combinedSlug: `${slug1}-${slug2}` };
  } else if (priceRange1 && yearBuilt2) {
    return { pageType: 'price-year-built', combinedSlug: `${slug1}-${slug2}` };
  } else if (priceRange1 && feature2) {
    return { pageType: 'price-feature', combinedSlug: `${slug1}-${slug2}` };
  }

  // Default fallback
  return { pageType: 'propertyType-price', combinedSlug: `${slug1}-${slug2}` };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cityName = unslugifyCityName(resolvedParams.citySlug);
  const pageInfo = determinePageType(resolvedParams.slug, resolvedParams.slug2);
  
  const propertyType = slugToPropertyType(resolvedParams.slug);
  const propertyTypeDisplay = formatPropertyType(resolvedParams.slug);
  const priceInfo = parsePriceRangeSlug(resolvedParams.slug);
  const priceInfo2 = parsePriceRangeSlug(resolvedParams.slug2);
  const bedroomInfo = parseBedroomSlug(resolvedParams.slug2);
  const bathroomInfo = parseBathroomSlug(resolvedParams.slug2);
  const sqftInfo = parseSqftSlug(resolvedParams.slug2);
  const lotSizeInfo = parseLotSizeSlug(resolvedParams.slug2);
  const yearBuiltInfo = parseYearBuiltSlug(resolvedParams.slug2);
  const ownershipInfo = parseOwnershipSlug(resolvedParams.slug2);
  const featureInfo = parseFeatureSlug(resolvedParams.slug2);
  
  let title = '';
  let description = '';

  if (pageInfo.pageType === 'propertyType-price') {
    const priceLabel = priceInfo2?.label || resolvedParams.slug2;
    title = `${propertyTypeDisplay} for Sale in ${cityName} ${priceLabel}`;
    description = `Find ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName} ${priceLabel.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'propertyType-bedrooms') {
    const bedroomLabel = bedroomInfo ? formatBedrooms(bedroomInfo.bedrooms, bedroomInfo.isPlus) : resolvedParams.slug2;
    title = `${bedroomLabel} ${propertyTypeDisplay} for Sale in ${cityName}`;
    description = `Find ${bedroomLabel.toLowerCase()} ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'propertyType-bathrooms') {
    const bathroomLabel = bathroomInfo ? formatBathrooms(bathroomInfo.bathrooms, bathroomInfo.isPlus) : resolvedParams.slug2;
    title = `${bathroomLabel} ${propertyTypeDisplay} for Sale in ${cityName}`;
    description = `Find ${bathroomLabel.toLowerCase()} ${propertyTypeDisplay.toLowerCase()} for sale in ${cityName}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'propertyType-sqft') {
    title = buildPropertyPageTitle('propertyType-sqft', cityName, resolvedParams.slug, undefined, undefined, undefined, sqftInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, undefined, undefined, undefined, sqftInfo);
  } else if (pageInfo.pageType === 'propertyType-lot-size') {
    title = buildPropertyPageTitle('propertyType-lot-size', cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, lotSizeInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, lotSizeInfo);
  } else if (pageInfo.pageType === 'propertyType-year-built') {
    title = buildPropertyPageTitle('propertyType-year-built', cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, undefined, yearBuiltInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, undefined, yearBuiltInfo);
  } else if (pageInfo.pageType === 'propertyType-ownership') {
    title = buildPropertyPageTitle('propertyType-ownership', cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, undefined, undefined, ownershipInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, undefined, undefined, ownershipInfo);
  } else if (pageInfo.pageType === 'propertyType-feature') {
    title = buildPropertyPageTitle('propertyType-feature', cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, undefined, undefined, undefined, featureInfo);
    description = buildPropertyPageDescription(cityName, resolvedParams.slug, undefined, undefined, undefined, undefined, undefined, undefined, undefined, featureInfo);
  } else if (pageInfo.pageType === 'price-bedrooms') {
    const priceLabel = priceInfo?.label || resolvedParams.slug;
    const bedroomLabel = bedroomInfo ? formatBedrooms(bedroomInfo.bedrooms, bedroomInfo.isPlus) : resolvedParams.slug2;
    title = `${bedroomLabel} Homes for Sale in ${cityName} ${priceLabel}`;
    description = `Find ${bedroomLabel.toLowerCase()} homes for sale in ${cityName} ${priceLabel.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'price-bathrooms') {
    const priceLabel = priceInfo?.label || resolvedParams.slug;
    const bathroomLabel = bathroomInfo ? formatBathrooms(bathroomInfo.bathrooms, bathroomInfo.isPlus) : resolvedParams.slug2;
    title = `${bathroomLabel} Homes for Sale in ${cityName} ${priceLabel}`;
    description = `Find ${bathroomLabel.toLowerCase()} homes for sale in ${cityName} ${priceLabel.toLowerCase()}. Browse listings, view photos, and connect with real estate agents.`;
  } else if (pageInfo.pageType === 'price-sqft') {
    const priceLabel = priceInfo?.label || resolvedParams.slug;
    title = buildPropertyPageTitle('price-sqft', cityName, undefined, priceInfo, undefined, undefined, sqftInfo);
    description = buildPropertyPageDescription(cityName, undefined, priceInfo, undefined, undefined, sqftInfo);
  } else if (pageInfo.pageType === 'price-lot-size') {
    const priceLabel = priceInfo?.label || resolvedParams.slug;
    title = buildPropertyPageTitle('price-lot-size', cityName, undefined, priceInfo, undefined, undefined, undefined, lotSizeInfo);
    description = buildPropertyPageDescription(cityName, undefined, priceInfo, undefined, undefined, undefined, lotSizeInfo);
  } else if (pageInfo.pageType === 'price-year-built') {
    const priceLabel = priceInfo?.label || resolvedParams.slug;
    title = buildPropertyPageTitle('price-year-built', cityName, undefined, priceInfo, undefined, undefined, undefined, undefined, yearBuiltInfo);
    description = buildPropertyPageDescription(cityName, undefined, priceInfo, undefined, undefined, undefined, undefined, yearBuiltInfo);
  } else if (pageInfo.pageType === 'price-feature') {
    const priceLabel = priceInfo?.label || resolvedParams.slug;
    title = buildPropertyPageTitle('price-feature', cityName, undefined, priceInfo, undefined, undefined, undefined, undefined, undefined, undefined, featureInfo);
    description = buildPropertyPageDescription(cityName, undefined, priceInfo, undefined, undefined, undefined, undefined, undefined, undefined, featureInfo);
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

export default async function PropertyCombinedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const pageInfo = determinePageType(resolvedParams.slug, resolvedParams.slug2);
  
  return (
    <PropertyBasePage
      slug={pageInfo.combinedSlug}
      pageType={pageInfo.pageType}
      citySlug={resolvedParams.citySlug}
    />
  );
}

