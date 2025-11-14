"use client";

import LocationPage from '@/components/Location/LocationPage';
import React from 'react';
import { useParams } from 'next/navigation';

const CityPageRoute: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string;
  
  // Only show city page if citySlug ends with -real-estate
  if (!citySlug || !citySlug.endsWith('-real-estate')) {
    return null; // This route shouldn't match property pages
  }
  
  return <LocationPage locationType="city" />;
};

export default CityPageRoute;

