"use client";

import Item from '@/components/Item/Item';
import LocationPage from '@/components/Location/LocationPage';
import React from 'react';
import { useParams } from 'next/navigation';

const DynamicPageRoute: React.FC = () => {
  const params = useParams();
  const citySlug = params?.citySlug as string;
  const slug = params?.slug as string;
  
  // Property pages: citySlug does NOT end with -real-estate AND slug contains numbers
  if (!citySlug?.endsWith('-real-estate') && slug && /\d/.test(slug)) {
    return <Item />;
  }
  
  // Area pages: citySlug ends with -real-estate AND slug does NOT contain numbers
  if (citySlug?.endsWith('-real-estate') && slug && !/\d/.test(slug)) {
    // Check if slug is a reserved route
    const reservedRoutes = ['trends', 'areas', 'neighbourhoods'];
    if (reservedRoutes.includes(slug)) {
      return null;
    }
    return <LocationPage locationType="area" />;
  }
  
  // Default: return null (let other routes handle it)
  return null;
};

export default DynamicPageRoute;

