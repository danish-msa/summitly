import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseHomeownerPropertySlug, isSlugMlsNumber } from '@/lib/utils/homeownerUrl';
import { PropertyDetailContent } from '@/components/Homeowner';
import { fetchPropertyListings } from '@/data/data';
import { RepliersAPI } from '@/lib/api/repliers';

interface HomeownerPropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    mls?: string;
    boardId?: string;
  }>;
}

export async function generateMetadata({ params }: HomeownerPropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const isMls = isSlugMlsNumber(slug);
  const parsed = isMls ? null : parseHomeownerPropertySlug(slug);
  const address = parsed
    ? `${parsed.streetNumber || ''} ${parsed.streetName || ''}, ${parsed.city || ''}, ${parsed.state || ''}`.trim()
    : isMls
      ? `Property ${slug}`
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
  const resolvedSearchParams = await searchParams;
  const mlsFromQuery = resolvedSearchParams?.mls;
  const rawBoardId = resolvedSearchParams?.boardId
    ? parseInt(resolvedSearchParams.boardId, 10)
    : undefined;
  // Repliers API rejects boardId 0 – only pass when positive
  const boardIdFromQuery =
    rawBoardId != null && Number.isFinite(rawBoardId) && rawBoardId > 0
      ? rawBoardId
      : undefined;
  const isMlsSlug = isSlugMlsNumber(slug);
  const parsed = isMlsSlug ? null : parseHomeownerPropertySlug(slug);

  // When slug is not MLS and doesn't parse as address, 404.
  if (!isMlsSlug && !parsed) {
    notFound();
  }

  // MLS number to fetch: slug (when it's MLS) or mls query param.
  const mlsToFetch = isMlsSlug ? slug : mlsFromQuery;

  // Fetch property by MLS (from Banner search) or fall back to address matching for legacy links.
  let property = null as Awaited<ReturnType<typeof RepliersAPI.listings.getDetails>> | null;
  try {
    if (mlsToFetch) {
      property = await RepliersAPI.listings.getDetails(mlsToFetch, boardIdFromQuery);
    }

    if (!property && parsed) {
      const allProperties = await fetchPropertyListings();

      const normalize = (str: string | null | undefined): string =>
        (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

      const matched = allProperties.find(p => {
        const propStreetNum = normalize(p.address?.streetNumber);
        const propStreetName = normalize(p.address?.streetName);
        const propCity = normalize(p.address?.city);
        const propState = normalize(p.address?.state);

        const parsedStreetNum = normalize(parsed?.streetNumber);
        const parsedStreetName = normalize(parsed?.streetName);
        const parsedCity = normalize(parsed?.city);
        const parsedState = normalize(parsed?.state);

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

  // When we came by MLS slug but fetch failed, still render the page so the URL works;
  // show minimal content and a "couldn't load" message instead of 404.
  const loadFailed = isMlsSlug && !property;

  // Extract property details (may be undefined when loadFailed)
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
    <>
      {loadFailed && (
        <div
          className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800"
          role="alert"
        >
          We couldn&apos;t load this property&apos;s details. It may be off-market or the listing may have changed. Try searching again from{" "}
          <Link href="/homeowner" className="font-medium underline hover:no-underline">
            My Home
          </Link>
          .
        </div>
      )}
      <PropertyDetailContent
        propertySlug={slug}
        streetNumber={property?.address?.streetNumber || parsed?.streetNumber || undefined}
        streetName={property?.address?.streetName || parsed?.streetName || undefined}
        city={property?.address?.city || parsed?.city || undefined}
        state={property?.address?.state || parsed?.state || undefined}
        zip={property?.address?.zip || parsed?.zip || undefined}
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
    </>
  );
};

export default HomeownerPropertyPage;
