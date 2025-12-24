"use client";

import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaHome } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent, PROPERTY_TYPES } from '@/lib/types/filters';

// House type options (for Houses property type)
const HOUSE_TYPES = [
  { value: 'all', label: 'All House Types' },
  { value: 'Link', label: 'Link' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Semi-Detached', label: 'Semi-Detached' },
  { value: 'Detached', label: 'Detached' },
];

// Condo type options (for Condos property type)
const CONDO_TYPES = [
  { value: 'all', label: 'All Condo Types' },
  { value: 'Low-Rise', label: 'Low-Rise' },
  { value: 'Mid-Rise', label: 'Mid-Rise' },
  { value: 'High-Rise', label: 'High-Rise' },
];

const PropertyTypeFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const [showSubFilter, setShowSubFilter] = useState<boolean>(false);

  // Check if current property type has subfilters
  const hasSubFilter = filters.propertyType === 'house' || filters.propertyType === 'condo';
  const subFilterOptions = filters.propertyType === 'house' ? HOUSE_TYPES : 
                          filters.propertyType === 'condo' ? CONDO_TYPES : [];

  // Sync showSubFilter state when dropdown opens and property type has subfilters
  useEffect(() => {
    if (activeDropdown && hasSubFilter && !showSubFilter) {
      // If dropdown is open and we have a house/condo selected, show subfilter
      setShowSubFilter(true);
    } else if (!activeDropdown) {
      // Reset subfilter view when dropdown closes
      setShowSubFilter(false);
    }
  }, [activeDropdown, hasSubFilter, showSubFilter]);

  // Handle property type selection
  const handlePropertyTypeSelect = (value: string) => {
    const event = {
      target: {
        name: 'propertyType',
        value: value
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    
    // If selecting house or condo, show subfilter
    if (value === 'house' || value === 'condo') {
      setShowSubFilter(true);
    } else {
      setShowSubFilter(false);
      // Reset subPropertyType when changing away from house/condo
      handleFilterChange({
        target: {
          name: 'subPropertyType',
          value: 'all'
        }
      } as FilterChangeEvent);
      setActiveDropdown(false);
    }
  };

  // Handle sub-property type selection
  const handleSubPropertyTypeSelect = (value: string) => {
    // Create filter change event
    const event = {
      target: {
        name: 'subPropertyType',
        value: value
      }
    } as FilterChangeEvent;
    
    // Apply the filter change immediately
    handleFilterChange(event);
    
    // Close the dropdown after a brief moment to allow state update
    requestAnimationFrame(() => {
      setShowSubFilter(false);
      setActiveDropdown(false);
    });
  };

  // Get display text for property type
  const getPropertyTypeText = () => {
    if (filters.propertyType === 'all') return 'All Types';
    const baseType = filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1);
    
    // If subPropertyType is selected, show it
    if (filters.subPropertyType && filters.subPropertyType !== 'all') {
      return `${filters.subPropertyType} ${baseType}`;
    }
    
    return baseType;
  };

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'propertyType',
        value: 'all'
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    handleFilterChange({
      target: {
        name: 'subPropertyType',
        value: 'all'
      }
    } as FilterChangeEvent);
    setShowSubFilter(false);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-lg border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => {
          setActiveDropdown(!activeDropdown);
          // If property type is house/condo and has a selected subtype, show subfilter
          // Otherwise, if property type is house/condo but no subtype selected, show subfilter
          // Otherwise show main menu
          if (!activeDropdown && hasSubFilter) {
            setShowSubFilter(true);
          } else if (activeDropdown && !hasSubFilter) {
            setShowSubFilter(false);
          }
        }}
      >
        <FaHome className="text-secondary" />
        <span className="font-base text-sm md:text-sm">{getPropertyTypeText()}</span>
        {filters.propertyType !== 'all' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear property type filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-10 mt-2 w-full sm:w-[600px] bg-white rounded-lg shadow-lg p-4">
          {!showSubFilter ? (
            <>
              <p className="font-semibold mb-3">Property Type</p>
              <div className="grid grid-cols-4 gap-2">
                {PROPERTY_TYPES.map((option) => {
                  const isSelected = filters.propertyType === option.value;
                  
                  return (
                    <div 
                      key={`type-${option.value}`}
                      className={`
                        border rounded-md py-2 px-3 cursor-pointer text-center
                        transition-all hover:bg-gray-50 text-xs
                        ${isSelected 
                          ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                          : 'border-gray-300 hover:border-secondary text-gray-700'}
                      `}
                      onClick={() => handlePropertyTypeSelect(option.value)}
                    >
                      {option.label}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setShowSubFilter(false)}
                  className="text-secondary hover:text-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="font-semibold">
                  {filters.propertyType === 'house' ? 'House Type' : 'Condo Type'}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {subFilterOptions.map((option) => {
                  // Check if this option is selected - handle both undefined and 'all' cases
                  const currentSubType = filters.subPropertyType;
                  const isSelected = option.value === 'all' 
                    ? (!currentSubType || currentSubType === 'all')
                    : (currentSubType === option.value);
                  
                  return (
                    <div 
                      key={`subtype-${option.value}`}
                      className={`
                        border rounded-md py-2 px-3 cursor-pointer text-center
                        transition-all hover:bg-gray-50 text-sm
                        ${isSelected 
                          ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                          : 'border-gray-300 hover:border-secondary text-gray-700'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSubPropertyTypeSelect(option.value);
                      }}
                    >
                      {option.label}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyTypeFilter;
