'use client';

import React from 'react';
import type { PropertyListing } from '@/lib/types';
import RentPageListingsSection from '../RentPageListingsSection/RentPageListingsSection';

/** Repliers condominium.pets: "No" | "Yes" | "Yes-with Restrictions". Include only pet-allowing. */
function isPetFriendly(listing: PropertyListing): boolean {
  const pets = listing.condominium?.pets;
  if (!pets || typeof pets !== 'string') return false;
  const normalized = pets.trim().toLowerCase();
  if (normalized === 'no') return false;
  if (normalized === 'yes') return true;
  if (normalized === 'yes-with restrictions') return true;
  return false;
}

export default function PetFriendlyRentalsSection() {
  return (
    <RentPageListingsSection
      headingId="rent-pet-friendly-heading"
      title="Pet-friendly rentals"
      viewAllHref="/listings?listingType=rent"
      sortBy="statusAscListDateDesc"
      filterListings={isPetFriendly}
    />
  );
}
