"use client";

import React from 'react';
import { FilterComponentProps } from '@/lib/types/filters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { useLocationDetection } from '@/hooks/useLocationDetection';

const ListingFilters: React.FC<FilterComponentProps> = ({ 
  filters, 
  handleFilterChange, 
  resetFilters,
  communities,
  locations
}) => {
  // Get user's detected location
  const { location } = useLocationDetection();
  
  // Create dynamic title based on location
  const getLocationTitle = () => {
    if (location) {
      // If we have a detected location, use the city name
      return `Listings in ${location.city}`;
    }
    
    // If no location detected, check if filters have a specific location selected
    if (filters.location && filters.location !== 'all') {
      const selectedLocation = locations?.find(loc => loc.id === filters.location);
      if (selectedLocation) {
        return `Listings in ${selectedLocation.name}`;
      }
    }
    
    // Default fallback
    return 'Listings in Toronto';
  };

  return (
    <div className="w-[1400px] mx-auto flex flex-col md:flex-row md:flex-wrap justify-between items-start md:items-center mt-8 md:mt-12 mb-6 md:mb-10 pb-4 md:pb-6 border-b-2 gap-4">
      <h2 className='text-black text-xl mb-2 md:mb-0'>{getLocationTitle()}</h2><br/>
      <GlobalFilters
        filters={filters}
        handleFilterChange={handleFilterChange}
        resetFilters={resetFilters}
        communities={communities}
        locations={locations}
        showLocation={true}
        showPropertyType={true}
        showCommunity={true}
        showPrice={true}
        showBedrooms={true}
        showBathrooms={true}
        layout="horizontal"
        className="w-full md:w-auto"
      />
    </div>
  );
};

export default ListingFilters;