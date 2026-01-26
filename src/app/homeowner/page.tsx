"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertySuggestion } from '@/hooks/usePropertySearch';
import { getHomeownerPropertyUrl } from '@/lib/utils/homeownerUrl';
import { HomeownerBanner, HomeownerContent } from '@/components/Homeowner';

const HomeownerPage: React.FC = () => {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<PropertySuggestion | null>(null);

  const handlePropertySelect = async (property: PropertySuggestion) => {
    setSelectedProperty(property);
    
    // Try to fetch full property data to get zip code
    try {
      const { fetchPropertyListings } = await import('@/data/data');
      const allProperties = await fetchPropertyListings();
      const fullProperty = allProperties.find(p => p.mlsNumber === property.id);
      
      if (fullProperty) {
        const propertyForUrl = {
          address: {
            streetNumber: fullProperty.address.streetNumber || null,
            streetName: fullProperty.address.streetName || null,
            city: fullProperty.address.city || null,
            state: fullProperty.address.state || null,
            zip: fullProperty.address.zip || null,
          }
        };

        // Navigate to the property detail page
        const url = getHomeownerPropertyUrl(propertyForUrl);
        router.push(url);
      } else {
        // Fallback: construct from PropertySuggestion without zip
        const addressParts = property.address.split(',').map(p => p.trim());
        const streetParts = addressParts[0]?.split(' ') || [];
        const streetNumber = streetParts[0] || null;
        const streetName = streetParts.slice(1).join(' ') || null;
        
        const propertyForUrl = {
          address: {
            streetNumber,
            streetName,
            city: property.city || null,
            state: property.region || null,
            zip: null,
          }
        };

        const url = getHomeownerPropertyUrl(propertyForUrl);
        router.push(url);
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
      // Fallback: construct from PropertySuggestion without zip
      const addressParts = property.address.split(',').map(p => p.trim());
      const streetParts = addressParts[0]?.split(' ') || [];
      const streetNumber = streetParts[0] || null;
      const streetName = streetParts.slice(1).join(' ') || null;
      
      const propertyForUrl = {
        address: {
          streetNumber,
          streetName,
          city: property.city || null,
          state: property.region || null,
          zip: null,
        }
      };

      const url = getHomeownerPropertyUrl(propertyForUrl);
      router.push(url);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeownerBanner onPropertySelect={handlePropertySelect} />
      <HomeownerContent />
    </div>
  );
};

export default HomeownerPage;
