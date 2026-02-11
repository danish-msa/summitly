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
    <div className="w-full">
      {/* Mobile: Horizontal scrollable container */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 items-center min-w-max pb-2">
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
            className="flex gap-2"
          />
        </div>
      </div>
      
      {/* Desktop: Normal flex-wrap layout */}
      <div className="hidden md:flex flex-row flex-wrap items-center gap-4">
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
          className="w-auto"
        />
      </div>
    </div>
  );
};

export default PropertyFilters;
