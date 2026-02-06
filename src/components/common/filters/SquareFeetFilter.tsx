"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { Maximize2 } from 'lucide-react';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const SquareFeetFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

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
    const minEvent: FilterChangeEvent = {
      target: {
        name: 'minSquareFeet',
        value: 0
      }
    };
    const maxEvent: FilterChangeEvent = {
      target: {
        name: 'maxSquareFeet',
        value: 0
      }
    };
    handleFilterChange(minEvent);
    handleFilterChange(maxEvent);
  };

  const hasActiveFilter = filters.minSquareFeet || filters.maxSquareFeet;

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-lg border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <Maximize2 className="w-4 h-4" />
        <span>{getSquareFeetText()}</span>
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
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          {[
            { label: 'All', value: 'all', min: undefined, max: undefined },
            { label: 'Under 1,000', value: 'under-1000', min: undefined, max: 999 },
            { label: '1,000 - 1,500', value: '1000-1500', min: 1000, max: 1500 },
            { label: 'Over 1,500', value: 'over-1500', min: 1501, max: undefined }
          ].map((option) => {
            const isSelected =
              (option.value === 'all' && !hasActiveFilter) ||
              (option.value === 'under-1000' && filters.maxSquareFeet === 999 && !filters.minSquareFeet) ||
              (option.value === '1000-1500' && filters.minSquareFeet === 1000 && filters.maxSquareFeet === 1500) ||
              (option.value === 'over-1500' && filters.minSquareFeet === 1501 && !filters.maxSquareFeet);
            return (
              <button
                key={option.value}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => {
                  handleFilterChange({
                    target: { name: 'minSquareFeet', value: option.min ?? 0 }
                  } as FilterChangeEvent);
                  handleFilterChange({
                    target: { name: 'maxSquareFeet', value: option.max ?? 0 }
                  } as FilterChangeEvent);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SquareFeetFilter;

