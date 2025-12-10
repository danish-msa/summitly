"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaBath } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const BathroomFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle bathroom selection
  const handleBathroomSelect = (value: number) => {
    const event = {
      target: {
        name: 'bathrooms',
        value: value.toString()
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for bathrooms
  const getBathroomText = () => {
    if (filters.bathrooms === 0) return 'All';
    if (filters.bathrooms === 4) return '4+ Baths';
    return `${filters.bathrooms} Baths`;
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'bathrooms',
        value: '0'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-lg border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaBath className="text-secondary" />
        <span className="text-sm">{getBathroomText()}</span>
        {filters.bathrooms !== 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear bathroom filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-10 mt-2 left-0 w-auto min-w-fit bg-white rounded-lg shadow-lg p-4">
          <p className="font-semibold mb-3">Bathrooms</p>
          <div className="flex gap-0">
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
                    py-2 px-3 text-xs whitespace-nowrap transition-all
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
  );
};

export default BathroomFilter;
