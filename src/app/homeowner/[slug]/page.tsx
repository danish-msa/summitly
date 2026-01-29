import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseHomeownerPropertySlug } from '@/lib/utils/homeownerUrl';
import { PropertyDetailContent } from '@/components/Homeowner';
import { fetchPropertyListings } from '@/data/data';
import { RepliersAPI } from '@/lib/api/repliers';

interface HomeownerPropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    mls?: string;
  }>;
}

export async function generateMetadata({ params }: HomeownerPropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseHomeownerPropertySlug(slug);
  
  const address = parsed 
    ? `${parsed.streetNumber || ''} ${parsed.streetName || ''}, ${parsed.city || ''}, ${parsed.state || ''}`.trim()
    : 'Property';

  return {
    title: `${address} | My Home`,
    description: `View property details and insights for ${address}`,
    openGraph: {
      title: `${address} | My Home`,
      description: `View property details and insights for ${address}`,
      type: 'website',
    },
    alternates: {
      canonical: `/homeowner/${slug}`,
    },
  };
}

const HomeownerPropertyPage: React.FC<HomeownerPropertyPageProps> = async ({ params, searchParams }) => {
  const { slug } = await params;
  const mlsFromQuery = (await searchParams)?.mls;
  const parsed = parseHomeownerPropertySlug(slug);

  if (!parsed) {
    notFound();
  }

  // Fetch property primarily by MLS id (passed from homeowner search).
  // Fall back to address matching only if MLS is missing (e.g., old links).
  let property = null as Awaited<ReturnType<typeof RepliersAPI.listings.getDetails>> | null;
  try {
    if (mlsFromQuery) {
      property = await RepliersAPI.listings.getDetails(mlsFromQuery);
    }

    if (!property) {
      const allProperties = await fetchPropertyListings();

      const normalize = (str: string | null | undefined): string =>
        (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

      const matched = allProperties.find(p => {
        const propStreetNum = normalize(p.address?.streetNumber);
        const propStreetName = normalize(p.address?.streetName);
        const propCity = normalize(p.address?.city);
        const propState = normalize(p.address?.state);

        const parsedStreetNum = normalize(parsed.streetNumber);
        const parsedStreetName = normalize(parsed.streetName);
        const parsedCity = normalize(parsed.city);
        const parsedState = normalize(parsed.state);

        const streetNumMatch = !parsedStreetNum || propStreetNum === parsedStreetNum;
        const streetNameMatch = !parsedStreetName ||
          propStreetName === parsedStreetName ||
          propStreetName.includes(parsedStreetName) ||
          parsedStreetName.includes(propStreetName);
        const cityMatch = !parsedCity ||
          propCity === parsedCity ||
          propCity.includes(parsedCity) ||
          parsedCity.includes(propCity);
        const stateMatch = !parsedState || propState === parsedState;

        return streetNumMatch && streetNameMatch && cityMatch && stateMatch;
      });

      if (matched?.mlsNumber) {
        property = await RepliersAPI.listings.getDetails(matched.mlsNumber);
      }
    }
  } catch (error) {
    console.error('Error fetching property data:', error);
  }

  // Extract property details
  const beds = property?.details?.numBedrooms;
  const baths = property?.details?.numBathrooms;
  const sqft = property?.details?.sqft;
  const latitude = property?.map?.latitude ?? undefined;
  const longitude = property?.map?.longitude ?? undefined;
  
  const yearBuilt =
    property?.details?.yearBuilt != null ? String(property.details.yearBuilt) : undefined;
  const garage = property?.details?.numGarageSpaces ?? undefined;
  
  const lotSize = property?.lot?.acres ? `${property.lot.acres} acre` : undefined;
  const propertyImage = property?.images?.imageUrl || property?.images?.allImages?.[0] || undefined;

  return (
    <PropertyDetailContent
      propertySlug={slug}
      streetNumber={property?.address?.streetNumber || parsed.streetNumber || undefined}
      streetName={property?.address?.streetName || parsed.streetName || undefined}
      city={property?.address?.city || parsed.city || undefined}
      state={property?.address?.state || parsed.state || undefined}
      zip={property?.address?.zip || parsed.zip || undefined}
      neighborhood={property?.address?.neighborhood || undefined}
      beds={beds}
      baths={baths}
      sqft={sqft}
      lotSize={lotSize}
      garage={garage}
      yearBuilt={yearBuilt}
      latitude={latitude ?? undefined}
      longitude={longitude ?? undefined}
      propertyImage={propertyImage}
    />
  );
};

export default HomeownerPropertyPage;
