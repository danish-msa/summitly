"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

const CommunityFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange,
  communities
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
    <div className="relative w-full sm:w-auto filter-dropdown" ref={containerRef}>
      <button 
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span>{getCommunityText()}</span>
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
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          <button
            type="button"
            className={`
              w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
              ${filters.community === 'all' ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
            `}
            onClick={() => handleCommunitySelect('all')}
          >
            All Communities
          </button>
          {communities.map((community) => {
            const isSelected = filters.community === community;
            return (
              <button
                key={community}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleCommunitySelect(community)}
              >
                {community}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityFilter;
