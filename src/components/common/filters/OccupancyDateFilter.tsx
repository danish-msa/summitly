"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaCalendar } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Generate occupancy date options (current year to 10 years ahead)
const generateOccupancyDates = () => {
  const currentYear = new Date().getFullYear();
  const dates = [{ value: 'all', label: 'All Dates' }];
  
  // Add quarters for current year and next 10 years
  for (let year = currentYear; year <= currentYear + 10; year++) {
    dates.push(
      { value: `Q1 ${year}`, label: `Q1 ${year}` },
      { value: `Q2 ${year}`, label: `Q2 ${year}` },
      { value: `Q3 ${year}`, label: `Q3 ${year}` },
      { value: `Q4 ${year}`, label: `Q4 ${year}` }
    );
  }
  
  return dates;
};

const OCCUPANCY_DATES = generateOccupancyDates();

const OccupancyDateFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  // Handle occupancy date selection
  const handleOccupancyDateSelect = (value: string) => {
    const event = {
      target: {
        name: 'occupancyDate',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Get display text for occupancy date
  const getOccupancyDateText = () => {
    const dateValue = filters.occupancyDate || 'all';
    const selectedDate = OCCUPANCY_DATES.find(d => d.value === dateValue);
    return selectedDate ? selectedDate.label : 'All Dates';
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'occupancyDate',
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
        <FaCalendar className="text-secondary" />
        <span>{getOccupancyDateText()}</span>
        {filters.occupancyDate && filters.occupancyDate !== 'all' && filters.occupancyDate !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear occupancy date filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-[100] mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
          <p className="font-semibold mb-3">Occupancy Date</p>
          <div className="space-y-2">
            {OCCUPANCY_DATES.map((date) => {
              const isSelected = (filters.occupancyDate || 'all') === date.value;
              
              return (
                <div 
                  key={`date-${date.value}`}
                  className={`
                    border rounded-md py-2 px-3 cursor-pointer
                    transition-all hover:bg-gray-50 text-sm
                    ${isSelected 
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                      : 'border-gray-300 hover:border-secondary text-gray-700'}
                  `}
                  onClick={() => handleOccupancyDateSelect(date.value)}
                >
                  {date.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupancyDateFilter;

