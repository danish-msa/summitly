"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaHome } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent, PROPERTY_TYPES } from '@/lib/types/filters';

const PropertyTypeFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle property type selection
  const handlePropertyTypeSelect = (value: string) => {
    const event = {
      target: {
        name: 'propertyType',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for property type
  const getPropertyTypeText = () => {
    if (filters.propertyType === 'all') return 'All Types';
    return filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1);
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'propertyType',
        value: 'all'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-full border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaHome className="text-secondary" />
        <span className="font-base text-sm md:text-sm">{getPropertyTypeText()}</span>
        {filters.propertyType !== 'all' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear property type filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4">
          <p className="font-semibold mb-3">Property Type</p>
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPES.map((option) => {
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
  );
};

export default PropertyTypeFilter;
