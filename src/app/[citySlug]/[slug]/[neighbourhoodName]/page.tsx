"use client";

import LocationPage from '@/components/Location/LocationPage';
import React from 'react';
import { useParams } from 'next/navigation';

const NeighbourhoodPageRoute: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string;
  const slug = params?.slug as string; // This is the area name
  const neighbourhoodName = params?.neighbourhoodName as string;
  
  // Only show neighbourhood page if citySlug ends with -real-estate
  // This ensures it doesn't conflict with property pages
  if (!citySlug || !citySlug.endsWith('-real-estate')) {
    return null; // This route shouldn't match property pages
  }
  
  // If slug or neighbourhoodName is one of the reserved routes, don't show neighbourhood page
  const reservedRoutes = ['trends', 'areas', 'neighbourhoods'];
  if (!slug || !neighbourhoodName || 
      reservedRoutes.includes(slug) || reservedRoutes.includes(neighbourhoodName)) {
    return null;
  }
  
  return <LocationPage locationType="neighbourhood" />;
};

export default NeighbourhoodPageRoute;

