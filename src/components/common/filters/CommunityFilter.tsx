"use client";

import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const CommunityFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange,
  communities
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle community selection
  const handleCommunitySelect = (value: string) => {
    const event = {
      target: {
        name: 'community',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for community
  const getCommunityText = () => {
    if (filters.community === 'all') return 'All Communities';
    return filters.community;
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'community',
        value: 'all'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto filter-dropdown">
      <button 
        className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-full border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="font-base text-sm md:text-sm">{getCommunityText()}</span>
        {filters.community !== 'all' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear community filter"
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
              onClick={() => handleCommunitySelect('all')}
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
                onClick={() => handleCommunitySelect(community)}
              >
                {community}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFilter;
