"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertySuggestion } from '@/hooks/usePropertySearch';
import { HomeownerBanner, HomeownerContent } from '@/components/Homeowner';

const HomeownerPage: React.FC = () => {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<PropertySuggestion | null>(null);

  const handlePropertySelect = async (property: PropertySuggestion) => {
    setSelectedProperty(property);

    // Pass property to detail page using MLS number in the path for reliable fetching.
    const params = new URLSearchParams();
    if (property.boardId != null && property.boardId > 0) params.set("boardId", String(property.boardId));
    const query = params.toString();
    router.push(`/homeowner/${encodeURIComponent(property.id)}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeownerBanner onPropertySelect={handlePropertySelect} />
      <HomeownerContent />
    </div>
  );
};

export default HomeownerPage;
