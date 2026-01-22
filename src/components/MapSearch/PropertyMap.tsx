"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { MAP_PROVIDER } from '@/lib/utils/mapProvider';
import { GooglePropertyMapProps } from './GooglePropertyMap';

// Dynamically import map components to avoid SSR issues
const GooglePropertyMap = dynamic(() => import('./GooglePropertyMap'), { ssr: false });
const MapboxPropertyMap = dynamic(() => import('./MapboxPropertyMap'), { ssr: false });

// Re-export the props type from GooglePropertyMap for consistency
export type PropertyMapProps = GooglePropertyMapProps;

/**
 * PropertyMap - Universal map component that switches between Google Maps and Mapbox
 * based on the MAP_PROVIDER environment variable
 */
const PropertyMap: React.FC<PropertyMapProps> = (props) => {
  if (MAP_PROVIDER === 'mapbox') {
    return <MapboxPropertyMap {...props} />;
  }
  
  return <GooglePropertyMap {...props} />;
};

export default PropertyMap;
