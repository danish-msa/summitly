'use client';

import React, { useState, useEffect } from 'react';
import { useGoogleMaps } from '@/providers/GoogleMapsProvider';
import GoogleMapsLoading from '@/components/common/GoogleMapsLoading';

interface SmartGoogleMapsWrapperProps {
  children: React.ReactNode;
}

const SmartGoogleMapsWrapper: React.FC<SmartGoogleMapsWrapperProps> = ({ children }) => {
  const { isLoaded, loadError, isLoading } = useGoogleMaps();
  const [showLoading, setShowLoading] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Listen for user interactions that might need Google Maps
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted && (isLoading || !isLoaded)) {
        setUserInteracted(true);
        setShowLoading(true);
      }
    };

    // Listen for focus events on location inputs
    const locationInputs = document.querySelectorAll('input[placeholder*="location"], input[placeholder*="address"], input[placeholder*="city"]');
    locationInputs.forEach(input => {
      input.addEventListener('focus', handleUserInteraction);
    });

    // Listen for clicks on location-related buttons
    const locationButtons = document.querySelectorAll('button[title*="location"], button[title*="detect"]');
    locationButtons.forEach(button => {
      button.addEventListener('click', handleUserInteraction);
    });

    return () => {
      locationInputs.forEach(input => {
        input.removeEventListener('focus', handleUserInteraction);
      });
      locationButtons.forEach(button => {
        button.removeEventListener('click', handleUserInteraction);
      });
    };
  }, [userInteracted, isLoading, isLoaded]);

  // Hide loading when Google Maps is loaded
  useEffect(() => {
    if (isLoaded) {
      setShowLoading(false);
    }
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Maps Error</h3>
        <p className="text-sm text-red-600 text-center">
          Unable to load Google Maps. Please check your internet connection and try again.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (showLoading) {
    return <GoogleMapsLoading />;
  }

  return <>{children}</>;
};

export default SmartGoogleMapsWrapper;
