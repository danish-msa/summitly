"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';
import { BedIcon } from 'lucide-react';

const BedroomFilter: React.FC<IndividualFilterProps> = ({ 
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
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button 
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
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
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          {['Any', '1', '2', '3', '4', '5+'].map((value) => {
            const numValue = value === 'Any' ? 0 : value === '5+' ? 5 : parseInt(value);
            const isSelected =
              (value === 'Any' && filters.bedrooms === 0) ||
              (value !== 'Any' && value !== '5+' && filters.bedrooms === numValue) ||
              (value === '5+' && filters.bedrooms >= 5);
            return (
              <button
                key={`bed-${value}`}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleBedroomSelect(numValue)}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BedroomFilter;
