"use client";

import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';
import { BedIcon } from 'lucide-react';

const BedroomFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle bedroom selection
  const handleBedroomSelect = (value: number) => {
    const event = {
      target: {
        name: 'bedrooms',
        value: value.toString()
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for bedrooms
  const getBedroomText = () => {
    if (filters.bedrooms === 0) return 'All';
    if (filters.bedrooms === 5) return '5+ Beds';
    return `${filters.bedrooms} Beds`;
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'bedrooms',
        value: '0'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all ${activeDropdown ? 'border-2 border-secondary text-primary' : 'border border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <BedIcon className="w-4 h-4" />
        <span>{getBedroomText()}</span>
        {filters.bedrooms !== 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all cursor-pointer"
            title="Clear bedroom filter"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleIndividualReset();
              }
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-[100] mt-2 left-0 w-auto min-w-fit bg-white rounded-lg shadow-lg p-4">
          <p className="font-semibold mb-3">Bedrooms</p>
          <div className="flex gap-0">
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
                    py-2 px-3 text-xs whitespace-nowrap transition-all
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
  );
};

export default BedroomFilter;
