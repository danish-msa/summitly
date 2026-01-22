"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MapboxContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  isLoading: boolean;
}

const MapboxContext = createContext<MapboxContextType>({
  isLoaded: false,
  loadError: undefined,
  isLoading: true,
});

export const useMapbox = () => {
  const context = useContext(MapboxContext);
  if (!context) {
    throw new Error('useMapbox must be used within a MapboxProvider');
  }
  return context;
};

interface MapboxProviderProps {
  children: React.ReactNode;
}

export const MapboxProvider: React.FC<MapboxProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Mapbox GL JS is available
    if (typeof window !== 'undefined') {
      try {
        // Dynamically import mapbox-gl to avoid SSR issues
        import('mapbox-gl').then((mapboxgl) => {
          // Set Mapbox access token
          const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
          if (accessToken) {
            mapboxgl.default.accessToken = accessToken;
            setIsLoaded(true);
            setIsLoading(false);
          } else {
            const error = new Error('Mapbox access token is not configured');
            setLoadError(error);
            setIsLoading(false);
          }
        }).catch((error) => {
          setLoadError(error);
          setIsLoading(false);
        });
      } catch (error) {
        setLoadError(error as Error);
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <MapboxContext.Provider value={{ isLoaded, loadError, isLoading }}>
      {children}
    </MapboxContext.Provider>
  );
};

export default MapboxProvider;
