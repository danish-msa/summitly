"use client";

import LocationTrendsPage from '@/components/Location/LocationTrendsPage';
import React from 'react';
import { useParams } from 'next/navigation';

const AreaTrendsPage: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string;
  
  // Only show area trends page if citySlug ends with -real-estate
  if (!citySlug?.endsWith('-real-estate')) {
    return null;
  }
  
  return <LocationTrendsPage locationType="area" />;
};

export default AreaTrendsPage;

