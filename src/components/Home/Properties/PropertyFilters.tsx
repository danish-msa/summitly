"use client";

import React from 'react';
import { FilterComponentProps } from '@/lib/types/filters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';

const PropertyFilters: React.FC<FilterComponentProps> = ({ 
  filters, 
  handleFilterChange, 
  communities,
  locations
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row md:flex-wrap items-center gap-4">
      <div className='flex flex-wrap gap-2 w-full md:w-auto justify-center'>
        <GlobalFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={() => {
            // Reset all filters to default values
            const resetEvent = {
              target: {
                name: 'locationAndArea',
                value: { location: 'all', area: 'all' }
              }
            } as FilterChangeEvent;
            handleFilterChange(resetEvent);
            
            const propertyTypeEvent = {
              target: {
                name: 'propertyType',
                value: 'all'
              }
            } as FilterChangeEvent;
            handleFilterChange(propertyTypeEvent);
            
            const communityEvent = {
              target: {
                name: 'community',
                value: 'all'
              }
            } as FilterChangeEvent;
            handleFilterChange(communityEvent);
          }}
          communities={communities}
          locations={locations}
          showLocation={true}
          showPropertyType={true}
          showCommunity={true}
          showPrice={false}
          showBedrooms={false}
          showBathrooms={false}
          layout="horizontal"
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
};

export default PropertyFilters;
