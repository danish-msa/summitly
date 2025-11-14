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

// Custom full-screen loading overlay
const LoadingElement = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <img 
          src="/images/logo/favicon.png" 
          alt="Summitly Logo" 
          className="h-auto w-20 mb-4"
        />
        
        {/* Loading bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{
            animation: 'loading-bar 2s ease-in-out infinite'
          }}></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

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
      loadingElement={<LoadingElement />}
    >
      <GoogleMapsContext.Provider value={{ isLoaded, loadError, isLoading }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
};

export default GoogleMapsProvider;