'use client';

import React from 'react';
import type { PropertyListing } from '@/lib/types';
import RentPageListingsSection from '../RentPageListingsSection/RentPageListingsSection';

/** Repliers condominium.ensuiteLaundry: "Y" | "N". Include only in-unit laundry. */
function hasInUnitLaundry(listing: PropertyListing): boolean {
  const laundry = listing.condominium?.ensuiteLaundry;
  if (!laundry || typeof laundry !== 'string') return false;
  return laundry.trim().toUpperCase() === 'Y';
}

export default function RentalsWithInUnitLaundrySection() {
  return (
    <RentPageListingsSection
      headingId="rent-laundry-heading"
      title="Rentals with in-unit laundry"
      viewAllHref="/listings?listingType=rent"
      sortBy="statusAscListDateDesc"
      filterListings={hasInUnitLaundry}
    />
  );
}
