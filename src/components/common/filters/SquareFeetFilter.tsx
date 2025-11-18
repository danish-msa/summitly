"use client";

import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { Maximize2 } from 'lucide-react';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const SquareFeetFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Get display text for square feet
  const getSquareFeetText = () => {
    if (!filters.minSquareFeet && !filters.maxSquareFeet) return 'All Sqft';
    if (filters.minSquareFeet && filters.maxSquareFeet) {
      return `${filters.minSquareFeet.toLocaleString()} - ${filters.maxSquareFeet.toLocaleString()}`;
    }
    if (filters.minSquareFeet) {
      return `${filters.minSquareFeet.toLocaleString()}+`;
    }
    if (filters.maxSquareFeet) {
      return `Up to ${filters.maxSquareFeet.toLocaleString()}`;
    }
    return 'All Sqft';
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const minEvent = {
      target: {
        name: 'minSquareFeet',
        value: undefined
      }
    } as FilterChangeEvent;
    const maxEvent = {
      target: {
        name: 'maxSquareFeet',
        value: undefined
      }
    } as FilterChangeEvent;
    handleFilterChange(minEvent);
    handleFilterChange(maxEvent);
  };

  const hasActiveFilter = filters.minSquareFeet || filters.maxSquareFeet;

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-lg border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <Maximize2 className="w-4 h-4 text-secondary" />
        <span className="text-sm">{getSquareFeetText()}</span>
        {hasActiveFilter && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear square feet filter"
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
          <p className="font-semibold mb-3">Square Feet</p>
          <div className="flex flex-wrap border-collapse">
            {[
              { label: 'All', value: 'all', min: undefined, max: undefined },
              { label: 'Under 1,000', value: 'under-1000', min: undefined, max: 999 },
              { label: '1,000 - 1,500', value: '1000-1500', min: 1000, max: 1500 },
              { label: 'Over 1,500', value: 'over-1500', min: 1501, max: undefined }
            ].map((option, index) => {
              const isSelected = 
                (option.value === 'all' && !hasActiveFilter) ||
                (option.value === 'under-1000' && filters.maxSquareFeet === 999 && !filters.minSquareFeet) ||
                (option.value === '1000-1500' && filters.minSquareFeet === 1000 && filters.maxSquareFeet === 1500) ||
                (option.value === 'over-1500' && filters.minSquareFeet === 1501 && !filters.maxSquareFeet);
              
              const isFirst = index === 0;
              const isLast = index === 3;
              
              return (
                <label 
                  key={`sqft-${option.value}`}
                  className={`
                    border cursor-pointer capitalize text-center hover:bg-gray-100
                    py-2 px-3 text-sm flex-1 transition-all
                    ${isFirst ? 'rounded-l-lg' : 'border-l-transparent'}
                    ${isLast ? 'rounded-r-lg' : ''}
                    ${isSelected 
                      ? 'border-2 border-secondary text-secondary font-bold' 
                      : 'border-gray-300 hover:border-secondary'}
                  `}
                  onClick={() => {
                    const minEvent = {
                      target: {
                        name: 'minSquareFeet',
                        value: option.min
                      }
                    } as FilterChangeEvent;
                    const maxEvent = {
                      target: {
                        name: 'maxSquareFeet',
                        value: option.max
                      }
                    } as FilterChangeEvent;
                    handleFilterChange(minEvent);
                    handleFilterChange(maxEvent);
                  }}
                >
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SquareFeetFilter;

