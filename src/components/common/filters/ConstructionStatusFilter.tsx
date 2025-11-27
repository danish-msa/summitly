"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaHardHat } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Construction status options (based on completionProgress: 0 = Pre-construction, 1 = Construction, 2 = Complete)
const CONSTRUCTION_STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: '0', label: 'Pre-Construction' },
  { value: '1', label: 'Under Construction' },
  { value: '2', label: 'Completed' },
];

const ConstructionStatusFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle construction status selection
  const handleConstructionStatusSelect = (value: string) => {
    const event = {
      target: {
        name: 'constructionStatus',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for construction status
  const getConstructionStatusText = () => {
    const statusValue = filters.constructionStatus || 'all';
    const selectedStatus = CONSTRUCTION_STATUSES.find(s => s.value === statusValue);
    return selectedStatus ? selectedStatus.label : 'All Status';
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'constructionStatus',
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
        <FaHardHat className="text-secondary" />
        <span className="font-base text-sm md:text-sm">{getConstructionStatusText()}</span>
        {filters.constructionStatus && filters.constructionStatus !== 'all' && filters.constructionStatus !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear construction status filter"
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
          <p className="font-semibold mb-3">Construction Status</p>
          <div className="grid grid-cols-2 gap-2">
            {CONSTRUCTION_STATUSES.map((status) => {
              const isSelected = (filters.constructionStatus || 'all') === status.value;
              
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
                  onClick={() => handleConstructionStatusSelect(status.value)}
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

export default ConstructionStatusFilter;

