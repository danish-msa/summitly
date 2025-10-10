'use client';
import { LoadScript } from '@react-google-maps/api';
import React from 'react';

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}



const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    console.error('Google Maps API key is not defined in environment variables');
    return null;
  }

  return (
    <LoadScript
      googleMapsApiKey={googleMapsApiKey}
      libraries={['places']}
      googleMapsClientId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_CLIENT_ID}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;