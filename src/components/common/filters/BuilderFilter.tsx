"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaBuilding } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Mock builder/developer list - you can replace this with actual data from your API
const BUILDERS = [
  { value: 'all', label: 'All Builders' },
  { value: 'premium-developments', label: 'Premium Developments Inc.' },
  { value: 'ocean-view', label: 'Ocean View Developments' },
  { value: 'metro-builders', label: 'Metro Builders' },
  { value: 'alpine-homes', label: 'Alpine Homes' },
  { value: 'urban-developments', label: 'Urban Developments' },
  { value: 'luxury-constructions', label: 'Luxury Constructions' },
];

const BuilderFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle builder selection
  const handleBuilderSelect = (value: string) => {
    const event = {
      target: {
        name: 'builder',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for builder
  const getBuilderText = () => {
    const builderValue = filters.builder || 'all';
    const selectedBuilder = BUILDERS.find(b => b.value === builderValue);
    return selectedBuilder ? selectedBuilder.label : 'All Builders';
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'builder',
        value: 'all'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-lg border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaBuilding className="text-secondary" />
        <span className="font-base text-sm md:text-sm">{getBuilderText()}</span>
        {filters.builder && filters.builder !== 'all' && filters.builder !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear builder filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
          <p className="font-semibold mb-3">Builder / Developer</p>
          <div className="space-y-2">
            {BUILDERS.map((builder) => {
              const isSelected = (filters.builder || 'all') === builder.value;
              
              return (
                <div 
                  key={`builder-${builder.value}`}
                  className={`
                    border rounded-md py-2 px-3 cursor-pointer
                    transition-all hover:bg-gray-50 text-sm
                    ${isSelected 
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                      : 'border-gray-300 hover:border-secondary text-gray-700'}
                  `}
                  onClick={() => handleBuilderSelect(builder.value)}
                >
                  {builder.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderFilter;

