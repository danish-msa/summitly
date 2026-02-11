'use client';

import React from 'react';
import RentPageListingsSection from '../RentPageListingsSection/RentPageListingsSection';

/** Latest rentals for now; can be wired to rent-specials filter when API supports it */
export default function RentalsWithRentSpecialsSection() {
  return (
    <RentPageListingsSection
      headingId="rent-specials-heading"
      title="Rentals with rent specials"
      viewAllHref="/listings?listingType=rent"
      sortBy="statusAscListDateDesc"
    />
  );
}
