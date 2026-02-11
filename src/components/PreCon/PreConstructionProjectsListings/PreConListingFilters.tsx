"use client";

import React from 'react';
import { FilterComponentProps } from '@/lib/types/filters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { FaMapMarkerAlt, FaList } from 'react-icons/fa';

interface PreConListingFiltersProps extends FilterComponentProps {
  viewMode?: 'split' | 'list' | 'map';
  onViewModeChange?: (mode: 'split' | 'list' | 'map') => void;
}

const PreConListingFilters: React.FC<PreConListingFiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  resetFilters,
  communities,
  locations,
  viewMode = 'list',
  onViewModeChange
}) => {
  // Get user's detected location
  const { location } = useLocationDetection();
  
  // Create dynamic title based on location
  const getLocationTitle = () => {
    if (location) {
      return `Pre-Construction Projects in ${location.city}`;
    }
    
    if (filters.location && filters.location !== 'all') {
      const selectedLocation = locations?.find(loc => loc.id === filters.location);
      if (selectedLocation) {
        return `Pre-Construction Projects in ${selectedLocation.name}`;
      }
    }
    
    return 'Pre-Construction Projects';
  };

  return (
    <div className="container mx-auto bg-white rounded-lg p-4 flex flex-col md:flex-row md:flex-wrap justify-between items-start md:items-center mt-8 mb-2 gap-4">
      <h2 className='text-black text-xl mb-2 md:mb-0'>{getLocationTitle()}</h2>
      <div className="w-full md:w-auto flex flex-wrap items-center gap-1">
        <GlobalFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          communities={communities}
          locations={locations}
          showLocation={true}
          showPropertyType={true}
          showCommunity={true}
          showPrice={false}
          showBedrooms={false}
          showBathrooms={false}
          showPreConStatus={true}
          layout="horizontal"
          className="w-full md:w-auto"
        />
        {/* View Mode Toggles */}
        {onViewModeChange && (
          <div className="flex border rounded-md overflow-hidden">
            <button 
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <FaList />
            </button>
            <button 
              onClick={() => onViewModeChange('split')}
              className={`px-3 py-2 ${viewMode === 'split' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <div className="flex gap-1">
                <FaList className="w-3" />
                <FaMapMarkerAlt className="w-3" />
              </div>
            </button>
            <button 
              onClick={() => onViewModeChange('map')}
              className={`px-3 py-2 ${viewMode === 'map' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <FaMapMarkerAlt />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreConListingFilters;

