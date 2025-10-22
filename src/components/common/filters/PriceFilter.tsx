"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaDollarSign } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const PriceFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const minEvent = {
      target: {
        name: 'minPrice',
        value: 0
      }
    } as FilterChangeEvent;
    const maxEvent = {
      target: {
        name: 'maxPrice',
        value: 2000000
      }
    } as FilterChangeEvent;
    handleFilterChange(minEvent);
    handleFilterChange(maxEvent);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-full border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaDollarSign className="text-secondary" />
        <span className="text-sm md:text-base">{formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}</span>
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-10 mt-2 w-full sm:w-72 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Price Range</p>
            {(filters.minPrice > 0 || filters.maxPrice < 2000000) && (
              <button
                onClick={handleIndividualReset}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                title="Reset price range"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Min Price</label>
                <span className="text-sm font-medium">{formatPrice(filters.minPrice)}</span>
              </div>
              <input
                type="range"
                name="minPrice"
                min="0"
                max="1000000"
                step="10000"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Max Price</label>
                <span className="text-sm font-medium">{formatPrice(filters.maxPrice)}</span>
              </div>
              <input
                type="range"
                name="maxPrice"
                min="0"
                max="2000000"
                step="10000"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceFilter;
