"use client";

import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  city: string;
  area: string;
  fullLocation: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface UseLocationDetectionReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  detectLocation: () => void;
  clearLocation: () => void;
}

export const useLocationDetection = (): UseLocationDetectionReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to get location name from coordinates using Google Geocoding API
  const getLocationFromCoordinates = useCallback(async (lat: number, lng: number): Promise<LocationData | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error('No location data found');
      }

      // Parse the address components to extract city and area
      const result = data.results[0];
      const addressComponents = result.address_components;
      
      let city = '';
      let area = '';
      let province = '';
      
      // Extract city, area, and province from address components
      addressComponents.forEach((component: any) => {
        const types = component.types;
        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
          city = component.long_name;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          area = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          province = component.short_name;
        }
      });

      // If no area found, use city as area
      if (!area && city) {
        area = city;
      }

      // Create full location string
      const fullLocation = area && area !== city ? `${city} - ${area}` : city;

      return {
        city,
        area,
        fullLocation,
        coordinates: { lat, lng }
      };
    } catch (err) {
      console.error('Error getting location from coordinates:', err);
      return null;
    }
  }, []);

  // Function to detect user's current location
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await getLocationFromCoordinates(latitude, longitude);
          
          if (locationData) {
            setLocation(locationData);
            // Store in localStorage for persistence
            localStorage.setItem('userLocation', JSON.stringify(locationData));
          } else {
            setError('Could not determine your location');
          }
        } catch (err) {
          console.error('Error processing location:', err);
          setError('Could not determine your location');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Could not access your location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [getLocationFromCoordinates]);

  // Function to clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    localStorage.removeItem('userLocation');
  }, []);

  // Auto-detect location on mount if not already stored
  useEffect(() => {
    // Check if location is already stored
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation);
        setLocation(parsedLocation);
      } catch (err) {
        console.error('Error parsing stored location:', err);
        localStorage.removeItem('userLocation');
      }
    } else {
      // Auto-detect location silently
      detectLocation();
    }
  }, [detectLocation]);

  return {
    location,
    isLoading,
    error,
    detectLocation,
    clearLocation
  };
};
