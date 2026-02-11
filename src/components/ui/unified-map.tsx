"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { MAP_PROVIDER } from '@/lib/utils/mapProvider';
import { MapProps } from './map';

// Dynamically import map components to avoid SSR issues
const GoogleMap = dynamic(() => import('./map'), { ssr: false });
const MapboxMap = dynamic(() => import('./mapbox-map'), { ssr: false });

/**
 * UnifiedMap - Universal map component that switches between Google Maps and Mapbox
 * based on the MAP_PROVIDER environment variable
 */
const UnifiedMap: React.FC<MapProps> = (props) => {
  if (MAP_PROVIDER === 'mapbox') {
    return <MapboxMap {...props} />;
  }
  
  return <GoogleMap {...props} />;
};

export default UnifiedMap;
