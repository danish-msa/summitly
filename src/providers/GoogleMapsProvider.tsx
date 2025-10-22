'use client';

import React, { createContext, useContext, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  isLoading: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
  isLoading: true,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleLoad = () => {
    setIsLoaded(true);
    setIsLoading(false);
  };

  const handleError = (error: Error) => {
    setLoadError(error);
    setIsLoading(false);
  };

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={['places']}
      onLoad={handleLoad}
      onError={handleError}
    >
      <GoogleMapsContext.Provider value={{ isLoaded, loadError, isLoading }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
};

export default GoogleMapsProvider;