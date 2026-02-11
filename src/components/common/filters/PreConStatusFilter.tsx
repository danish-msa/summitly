"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaTag } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Pre-construction status options
const PRECON_STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'selling', label: 'Selling Now' },
  { value: 'coming-soon', label: 'Coming Soon' },
  { value: 'sold-out', label: 'Sold Out' },
];

const PreConStatusFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

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

  // Get display text for status
  const getStatusText = () => {
    const statusValue = filters.preConStatus || 'all';
    const selectedStatus = PRECON_STATUSES.find(s => s.value === statusValue);
    return selectedStatus ? selectedStatus.label : 'All Status';
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
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all ${activeDropdown ? 'border-2 border-secondary text-primary' : 'border border-gray-300 text-primary'} hover:border-secondary`}
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
        <div className="absolute z-[100] mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4">
          <p className="font-semibold mb-3">Status</p>
          <div className="grid grid-cols-2 gap-2">
            {PRECON_STATUSES.map((status) => {
              const isSelected = (filters.preConStatus || 'all') === status.value;
              
              return (
                <div 
                  key={`status-${status.value}`}
                  className={`
                    border rounded-md py-2 px-3 cursor-pointer text-center
                    transition-all hover:bg-gray-50 text-sm
                    ${isSelected 
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                      : 'border-gray-300 hover:border-secondary text-gray-700'}
                  `}
                  onClick={() => handleStatusSelect(status.value)}
                >
                  {status.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreConStatusFilter;

