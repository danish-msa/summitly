"use client";

import LocationTrendsPage from '@/components/Location/LocationTrendsPage';
import React from 'react';
import { useParams } from 'next/navigation';

const NeighbourhoodTrendsPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string;
  
  // Only show neighbourhood trends page if citySlug ends with -real-estate
  if (!citySlug?.endsWith('-real-estate')) {
    return null;
  }
  
  return <LocationTrendsPage locationType="neighbourhood" />;
};

export default NeighbourhoodTrendsPage;

