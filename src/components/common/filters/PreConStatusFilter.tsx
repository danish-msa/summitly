"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTag } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Pre-construction selling status options
const PRECON_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'selling', label: 'Selling Now' },
  { value: 'coming-soon', label: 'Coming Soon' },
  { value: 'sold-out', label: 'Sold Out' },
];

const PreConStatusFilter: React.FC<IndividualFilterProps> = ({ 
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

  // Handle status selection
  const handleStatusSelect = (value: string) => {
    const event = {
      target: {
        name: 'preConStatus',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for status (button shows "Selling Status" when All, or the specific option)
  const getStatusText = () => {
    const statusValue = filters.preConStatus || 'all';
    if (statusValue === 'all') return 'Selling Status';
    const selectedStatus = PRECON_STATUSES.find(s => s.value === statusValue);
    return selectedStatus ? selectedStatus.label : 'Selling Status';
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'preConStatus',
        value: 'all'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button 
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaTag className="text-secondary" />
        <span>{getStatusText()}</span>
        {filters.preConStatus && filters.preConStatus !== 'all' && filters.preConStatus !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear status filter"
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
          {PRECON_STATUSES.map((status) => {
            const isSelected = (filters.preConStatus || 'all') === status.value;
            return (
              <button
                key={status.value}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleStatusSelect(status.value)}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreConStatusFilter;

