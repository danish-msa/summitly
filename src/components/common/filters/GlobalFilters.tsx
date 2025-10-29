"use client";

import React, { useState } from 'react';
import { FilterComponentProps } from '@/lib/types/filters';
import LocationFilter from './LocationFilter';
import PropertyTypeFilter from './PropertyTypeFilter';
import CommunityFilter from './CommunityFilter';
import PriceFilter from './PriceFilter';
import BedroomFilter from './BedroomFilter';
import BathroomFilter from './BathroomFilter';
import EnhancedAdvancedFilters from './EnhancedAdvancedFilters';
import SellRentToggle from './SellRentToggle';

interface GlobalFiltersProps extends FilterComponentProps {
  showLocation?: boolean;
  showPropertyType?: boolean;
  showCommunity?: boolean;
  showPrice?: boolean;
  showBedrooms?: boolean;
  showBathrooms?: boolean;
  showAdvanced?: boolean;
  showSellRentToggle?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  handleFilterChange,
  resetFilters,
  communities,
  locations,
  showLocation = true,
  showPropertyType = true,
  showCommunity = true,
  showPrice = true,
  showBedrooms = true,
  showBathrooms = true,
  showAdvanced = true,
  showSellRentToggle = false,
  layout = 'horizontal',
  className = ''
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  
  const commonProps = {
    filters,
    handleFilterChange,
    communities,
    locations
  };

  const handleListingTypeChange = (type: 'sell' | 'rent') => {
    setListingType(type);
    // You can add additional logic here if needed
  };

  const filterComponents = [];

  if (showLocation) {
    filterComponents.push(
      <LocationFilter key="location" {...commonProps} />
    );
  }

  if (showPropertyType) {
    filterComponents.push(
      <PropertyTypeFilter key="propertyType" {...commonProps} />
    );
  }

  if (showCommunity) {
    filterComponents.push(
      <CommunityFilter key="community" {...commonProps} />
    );
  }

  if (showPrice) {
    filterComponents.push(
      <PriceFilter key="price" {...commonProps} />
    );
  }

  if (showBedrooms) {
    filterComponents.push(
      <BedroomFilter key="bedrooms" {...commonProps} />
    );
  }

  if (showBathrooms) {
    filterComponents.push(
      <BathroomFilter key="bathrooms" {...commonProps} />
    );
  }

  // Add Sell/Rent Toggle
  if (showSellRentToggle) {
    filterComponents.push(
      <SellRentToggle 
        key="sellRentToggle" 
        listingType={listingType}
        onListingTypeChange={handleListingTypeChange}
      />
    );
  }

  // Add Advanced Filters button
  if (showAdvanced) {
    filterComponents.push(
      <EnhancedAdvancedFilters
        key="advanced"
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={() => {
          // Advanced filters are applied immediately when changed
          // This function can be used for any additional logic
        }}
        onResetAdvanced={() => {
          // Reset only advanced filters
          const advancedFilterKeys = ['minSquareFeet', 'maxSquareFeet', 'yearBuilt', 'features', 'listingDate'];
          advancedFilterKeys.forEach(key => {
            handleFilterChange({
              target: {
                name: key,
                value: key === 'features' ? [] : (key.includes('SquareFeet') ? 0 : '')
              }
            });
          });
        }}
      />
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex ${layout === 'horizontal' ? 'flex-wrap gap-1' : 'flex-col gap-4'} items-center`}>
        {filterComponents}
        
        {/* Reset Filters Button */}
        <button 
          onClick={resetFilters}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-secondary hover:bg-gray-50 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Reset</span>
        </button>
      </div>
    </div>
  );
};

export default GlobalFilters;
