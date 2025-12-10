"use client";

import React from 'react';
import LocationFilter from '@/components/common/filters/LocationFilter';
import CommunityFilter from '@/components/common/filters/CommunityFilter';
import PropertyTypeFilter from '@/components/common/filters/PropertyTypeFilter';
import { YearRangeToggle } from './YearRangeToggle';
import { FilterState, FilterChangeEvent, LOCATIONS } from '@/lib/types/filters';

interface TrendsFiltersProps {
  filters: FilterState;
  onFilterChange: (e: FilterChangeEvent) => void;
  communities: string[];
  selectedYears: number;
  onYearsChange: (years: number) => void;
}

export const TrendsFilters: React.FC<TrendsFiltersProps> = ({
  filters,
  onFilterChange,
  communities,
  selectedYears,
  onYearsChange,
}) => {
  return (
    <div className="sticky top-16 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-1400 mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          
          {/* Filter Row */}
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
            {/* Year Range Toggle */}
            <YearRangeToggle selectedYears={selectedYears} onYearsChange={onYearsChange} />

            <div className="flex items-center gap-3">
              <LocationFilter
                filters={filters}
                handleFilterChange={onFilterChange}
                locations={LOCATIONS}
                communities={communities}
              />
              <PropertyTypeFilter
                filters={filters}
                handleFilterChange={onFilterChange}
                communities={communities}
              />
              <CommunityFilter
                filters={filters}
                handleFilterChange={onFilterChange}
                communities={communities}
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

