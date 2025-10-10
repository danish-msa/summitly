'use client';

import React from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
}

const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={['places']}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsWrapper;