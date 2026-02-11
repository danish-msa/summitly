'use client';

import React from 'react';
import type { PropertyListing } from '@/lib/types';
import RentPageListingsSection from '../RentPageListingsSection/RentPageListingsSection';

/** Repliers: details.swimmingPool (e.g. "Yes") or condominium.amenities (e.g. "Indoor Pool"). */
function hasPool(listing: PropertyListing): boolean {
  const poolDetail = listing.details?.swimmingPool;
  if (poolDetail && typeof poolDetail === 'string' && poolDetail.trim().toLowerCase() !== 'none') {
    return true;
  }
  const amenities = listing.condominium?.amenities;
  if (Array.isArray(amenities)) {
    const hasPoolAmenity = amenities.some(
      (a) => typeof a === 'string' && a.toLowerCase().includes('pool')
    );
    if (hasPoolAmenity) return true;
  }
  return false;
}

export default function RentalsWithPoolsSection() {
  return (
    <RentPageListingsSection
      headingId="rent-pools-heading"
      title="Rentals with pools"
      viewAllHref="/listings?listingType=rent"
      sortBy="statusAscListDateDesc"
      filterListings={hasPool}
    />
  );
}
