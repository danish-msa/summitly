"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCalendar } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent } from '@/lib/types/filters';

// Generate occupancy date options (years only: current year to 10 years ahead)
const generateOccupancyDates = () => {
  const currentYear = new Date().getFullYear();
  const dates = [{ value: 'all', label: 'All Dates' }];
  for (let year = currentYear; year <= currentYear + 10; year++) {
    const y = String(year);
    dates.push({ value: y, label: y });
  }
  return dates;
};

const OCCUPANCY_DATES = generateOccupancyDates();

const OccupancyDateFilter: React.FC<IndividualFilterProps> = ({ 
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

  // Get display text for occupancy date (show year only)
  const getOccupancyDateText = () => {
    const dateValue = filters.occupancyDate || 'all';
    if (dateValue === 'all') return 'All Dates';
    // If stored value is like "Q1 2026", show just the year
    const year = /20\d{2}/.exec(dateValue)?.[0] ?? dateValue;
    const found = OCCUPANCY_DATES.find(d => d.value === dateValue || d.value === year);
    return found ? found.label : year;
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
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button 
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
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
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          {OCCUPANCY_DATES.map((date) => {
            const isSelected = (filters.occupancyDate || 'all') === date.value;
            return (
              <button
                key={date.value}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                  ${isSelected ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleOccupancyDateSelect(date.value)}
              >
                {date.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OccupancyDateFilter;

