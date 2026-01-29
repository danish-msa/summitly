"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertySuggestion } from '@/hooks/usePropertySearch';
import { getHomeownerPropertyUrl } from '@/lib/utils/homeownerUrl';
import { HomeownerBanner, HomeownerContent } from '@/components/Homeowner';

const HomeownerPage: React.FC = () => {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<PropertySuggestion | null>(null);

  const handlePropertySelect = async (property: PropertySuggestion) => {
    setSelectedProperty(property);

    // Build a friendly slug from suggestion, but always carry the MLS id for fetching.
    const addressParts = property.address.split(',').map(p => p.trim());
    const streetParts = addressParts[0]?.split(' ') || [];
    const streetNumber = streetParts[0] || null;
    const streetName = streetParts.slice(1).join(' ') || null;
    
    const propertyForUrl = {
      address: {
        streetNumber,
        streetName,
        city: property.city || null,
        state: property.region || null,
        zip: null,
      }
    };

    const url = getHomeownerPropertyUrl(propertyForUrl);
    router.push(`${url}?mls=${encodeURIComponent(property.id)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeownerBanner onPropertySelect={handlePropertySelect} />
      <HomeownerContent />
    </div>
  );
};

export default HomeownerPage;
