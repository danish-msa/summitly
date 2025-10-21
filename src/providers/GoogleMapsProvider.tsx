"use client";

import React, { useState, useEffect, createContext, ReactNode } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
}

export const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null
});

interface GoogleMapsProviderProps {
  children: ReactNode;
  apiKey: string;
}

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children, apiKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Debug: Log API key status
    console.log('Google Maps API Key:', apiKey ? 'Present' : 'Missing');
    
    // Skip if already loaded or no API key
    if (window.google?.maps || !apiKey || document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
      if (!apiKey) {
        console.error('Google Maps API key is missing!');
        setLoadError(new Error('Google Maps API key is missing'));
      } else {
        setIsLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setLoadError(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount as it might be needed by other components
    };
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;