"use client";

import React from 'react';
import { FilterComponentProps } from '@/lib/types/filters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';

interface PropertyFiltersProps extends FilterComponentProps {
  showAdvanced?: boolean;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  resetFilters,
  communities,
  locations,
  showAdvanced = true
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row md:flex-wrap items-center gap-4">
      <div className='flex flex-wrap gap-2 w-full md:w-auto justify-center'>
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
          showAdvanced={showAdvanced}
          layout="horizontal"
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
};

export default PropertyFilters;
