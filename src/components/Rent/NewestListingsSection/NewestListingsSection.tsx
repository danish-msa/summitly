'use client';

import React from 'react';
import RentPageListingsSection from '../RentPageListingsSection/RentPageListingsSection';

export default function NewestListingsSection() {
  return (
    <RentPageListingsSection
      headingId="rent-newest-heading"
      title="Newest listings"
      viewAllHref="/listings?listingType=rent"
      sortBy="statusAscListDateDesc"
    />
  );
}
