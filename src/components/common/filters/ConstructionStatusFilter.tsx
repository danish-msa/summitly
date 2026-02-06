"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaHardHat } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Construction status options (based on completionProgress: 0 = Pre-construction, 1 = Construction, 2 = Complete)
const CONSTRUCTION_STATUSES = [
  { value: 'all', label: 'All' },
  { value: '0', label: 'Pre-Construction' },
  { value: '1', label: 'Under Construction' },
  { value: '2', label: 'Completed' },
];

const ConstructionStatusFilter: React.FC<IndividualFilterProps> = ({ 
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

  // Get display text for construction status (button shows "Construction Status" when All, or the specific option)
  const getConstructionStatusText = () => {
    const statusValue = filters.constructionStatus || 'all';
    if (statusValue === 'all') return 'Construction Status';
    const selectedStatus = CONSTRUCTION_STATUSES.find(s => s.value === statusValue);
    return selectedStatus ? selectedStatus.label : 'Construction Status';
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
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button 
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaHardHat className="text-secondary" />
        <span>{getConstructionStatusText()}</span>
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
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          {CONSTRUCTION_STATUSES.map((status) => {
            const isSelected = (filters.constructionStatus || 'all') === status.value;
            return (
              <button
                key={status.value}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleConstructionStatusSelect(status.value)}
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

export default ConstructionStatusFilter;

