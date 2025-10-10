"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaDollarSign, FaBed, FaBath, FaHome } from 'react-icons/fa';

// Add communities to the props interface
interface FiltersProps {
  filters: {
    minPrice: number;
    maxPrice: number;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    community: string;
    listingType: string;
  };
  handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  resetFilters: () => void;
  communities: string[];
}

const ListingFilters: React.FC<FiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  resetFilters,
  communities
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // For direct button selection
  const handleBedroomSelect = (value: number) => {
    const event = {
      target: {
        name: 'bedrooms',
        value: value.toString()
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    handleFilterChange(event);
    setActiveDropdown(null);
  };

  const handleBathroomSelect = (value: number) => {
    const event = {
      target: {
        name: 'bathrooms',
        value: value.toString()
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    handleFilterChange(event);
    setActiveDropdown(null);
  };

  const handlePropertyTypeSelect = (value: string) => {
    const event = {
      target: {
        name: 'propertyType',
        value: value
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    handleFilterChange(event);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  // Get display text for bedrooms
  const getBedroomText = () => {
    if (filters.bedrooms === 0) return 'Any Beds';
    if (filters.bedrooms === 5) return '5+ Beds';
    return `${filters.bedrooms} Beds`;
  };

  // Get display text for bathrooms
  const getBathroomText = () => {
    if (filters.bathrooms === 0) return 'Any Baths';
    if (filters.bathrooms === 4) return '4+ Baths';
    return `${filters.bathrooms} Baths`;
  };

  // Get display text for property type
  const getPropertyTypeText = () => {
    if (filters.propertyType === 'all') return 'All Types';
    return filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1);
  };

  // Use the resetFilters from props instead of implementing it here
  const handleResetClick = () => {
    resetFilters();
    setActiveDropdown(null);
  };

  // Add a function to get community text
  const getCommunityText = () => {
    if (filters.community === 'all') return 'All Communities';
    return filters.community;
  };

  return (
    <div className="w-[95%] mx-auto flex flex-col md:flex-row md:flex-wrap justify-between items-start md:items-center mt-8 md:mt-12 mb-6 md:mb-10 pb-4 md:pb-6 border-b-2 gap-4">
      <h2 className='text-black text-xl mb-2 md:mb-0'>Listings in Toronto</h2>
      <div className='flex flex-wrap gap-2 w-full md:w-auto'>
        {/* Price Filter */}
        <div className="relative w-full sm:w-auto">
          <button 
            className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'price' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('price')}
          >
            <FaDollarSign className="text-secondary" />
            <span className="text-sm md:text-base">{formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}</span>
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'price' && (
            <div className="absolute z-10 mt-2 w-full sm:w-72 bg-white rounded-lg shadow-lg p-4">
              <p className="font-semibold mb-3">Price Range</p>
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
        
        {/* Bedrooms Filter */}
        <div className="relative w-[48%] sm:w-auto">
          <button 
            className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'bedrooms' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('bedrooms')}
          >
            <FaBed className="text-secondary" />
            <span className="text-sm md:text-base">{getBedroomText()}</span>
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'bedrooms' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'bedrooms' && (
            <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4">
              <p className="font-semibold mb-3">Bedrooms</p>
              <div className="flex flex-wrap border-collapse">
                {['Any', '1', '2', '3', '4', '5+'].map((value, index) => {
                  const numValue = value === 'Any' ? 0 : value === '5+' ? 5 : parseInt(value);
                  const isSelected = 
                    (value === 'Any' && filters.bedrooms === 0) || 
                    (value !== 'Any' && value !== '5+' && filters.bedrooms === numValue) ||
                    (value === '5+' && filters.bedrooms >= 5);
                  
                  const isFirst = index === 0;
                  const isLast = index === 5;
                  
                  return (
                    <label 
                      key={`bed-${value}`}
                      className={`
                        border cursor-pointer capitalize text-center hover:bg-gray-100
                        py-2 px-3 text-sm flex-1 transition-all
                        ${isFirst ? 'rounded-l-lg' : 'border-l-transparent'}
                        ${isLast ? 'rounded-r-lg' : ''}
                        ${isSelected 
                          ? 'border-2 border-secondary text-secondary font-bold' 
                          : 'border-gray-300 hover:border-secondary'}
                      `}
                      onClick={() => handleBedroomSelect(numValue)}
                    >
                      {value}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Bathrooms Filter */}
        <div className="relative w-[48%] sm:w-auto">
          <button 
            className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'bathrooms' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('bathrooms')}
          >
            <FaBath className="text-secondary" />
            <span className="text-sm md:text-base">{getBathroomText()}</span>
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'bathrooms' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'bathrooms' && (
            <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4">
              <p className="font-semibold mb-3">Bathrooms</p>
              <div className="flex flex-wrap border-collapse">
                {['Any', '1', '2', '3', '4+'].map((value, index) => {
                  const numValue = value === 'Any' ? 0 : value === '4+' ? 4 : parseInt(value);
                  const isSelected = 
                    (value === 'Any' && filters.bathrooms === 0) || 
                    (value !== 'Any' && value !== '4+' && filters.bathrooms === numValue) ||
                    (value === '4+' && filters.bathrooms >= 4);
                  
                  const isFirst = index === 0;
                  const isLast = index === 4;
                  
                  return (
                    <label 
                      key={`bath-${value}`}
                      className={`
                        border cursor-pointer capitalize text-center hover:bg-gray-100
                        py-2 px-3 text-sm flex-1 transition-all
                        ${isFirst ? 'rounded-l-lg' : 'border-l-transparent'}
                        ${isLast ? 'rounded-r-lg' : ''}
                        ${isSelected 
                          ? 'border-2 border-secondary text-secondary font-bold' 
                          : 'border-gray-300 hover:border-secondary'}
                      `}
                      onClick={() => handleBathroomSelect(numValue)}
                    >
                      {value}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Property Type Filter */}
        <div className="relative w-[48%] sm:w-auto">
          <button 
            className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'propertyType' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('propertyType')}
          >
            <FaHome className="text-secondary" />
            <span className="text-sm md:text-base">{getPropertyTypeText()}</span>
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'propertyType' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'propertyType' && (
            <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4">
              <p className="font-semibold mb-3">Property Type</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'All Types' },
                  { value: 'house', label: 'House' },
                  { value: 'condo', label: 'Condo' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'townhouse', label: 'Townhouse' },
                  { value: 'commercial', label: 'Commercial' }
                ].map((option) => {
                  const isSelected = filters.propertyType === option.value;
                  
                  return (
                    <div 
                      key={`type-${option.value}`}
                      className={`
                        border rounded-md py-2 px-3 cursor-pointer text-center
                        transition-all hover:bg-gray-50 text-sm
                        ${isSelected 
                          ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                          : 'border-gray-300 hover:border-secondary text-gray-700'}
                      `}
                      onClick={() => handlePropertyTypeSelect(option.value)}
                    >
                      {option.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Community Filter */}
        <div className="relative w-[48%] sm:w-auto filter-dropdown">
          <button 
            className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'community' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('community')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm md:text-base">{getCommunityText()}</span>
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'community' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'community' && (
            <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
              <p className="font-semibold mb-3">Community</p>
              <div className="space-y-2">
                <div 
                  className={`
                    border rounded-md py-2 px-3 cursor-pointer text-center
                    transition-all hover:bg-gray-50 text-sm
                    ${filters.community === 'all' 
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                      : 'border-gray-300 hover:border-secondary text-gray-700'}
                  `}
                  onClick={() => {
                    const event = {
                      target: {
                        name: 'community',
                        value: 'all'
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFilterChange(event);
                    setActiveDropdown(null);
                  }}
                >
                  All Communities
                </div>
                
                {communities.map((community) => (
                  <div 
                    key={`community-${community}`}
                    className={`
                      border rounded-md py-2 px-3 cursor-pointer text-center
                      transition-all hover:bg-gray-50 text-sm
                      ${filters.community === community 
                        ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                        : 'border-gray-300 hover:border-secondary text-gray-700'}
                    `}
                    onClick={() => {
                      const event = {
                        target: {
                          name: 'community',
                          value: community
                        }
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleFilterChange(event);
                      setActiveDropdown(null);
                    }}
                  >
                    {community}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Reset Filters Button */}
        <button 
          onClick={handleResetClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:border-secondary hover:bg-gray-50 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm md:text-base">Reset Filters</span>
        </button>

      </div>
    </div>
  );
};

export default ListingFilters;