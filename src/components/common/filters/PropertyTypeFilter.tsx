"use client";

import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IndividualFilterProps, FilterChangeEvent, REPLIERS_PROPERTY_TYPE_OPTIONS } from '@/lib/types/filters';
import { HomeIcon } from 'lucide-react';

const REPLIERS_PROPERTY_TYPE_VALUES = new Set(REPLIERS_PROPERTY_TYPE_OPTIONS.map((o) => o.value));

function getPropertyTypeLabel(value: string | undefined): string {
  const v = value || 'all';
  if (REPLIERS_PROPERTY_TYPE_VALUES.has(v)) {
    const option = REPLIERS_PROPERTY_TYPE_OPTIONS.find((o) => o.value === v);
    return option?.label ?? v;
  }
  return 'Others';
}

const PropertyTypeFilter: React.FC<IndividualFilterProps> = ({
  filters,
  handleFilterChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);

  const handlePropertyTypeSelect = (value: string) => {
    handleFilterChange({
      target: { name: 'propertyType', value }
    } as FilterChangeEvent);
    setActiveDropdown(false);
  };

  const handleIndividualReset = () => {
    handleFilterChange({
      target: { name: 'propertyType', value: 'all' }
    } as FilterChangeEvent);
  };

  const displayText = getPropertyTypeLabel(filters.propertyType);
  const isFilterActive = filters.propertyType && filters.propertyType !== 'all';

  return (
    <div className="relative w-full sm:w-auto">
      <button
        className={`w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all ${activeDropdown ? 'border-2 border-secondary text-primary' : 'border border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <HomeIcon className="w-4 h-4" />
        <span>{displayText}</span>
        {isFilterActive && (
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
        <div className="absolute z-[100] mt-1 w-full min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-[280px] overflow-y-auto">
          {REPLIERS_PROPERTY_TYPE_OPTIONS.map((option) => {
            const currentValue = filters.propertyType || 'all';
            const effectiveValue = REPLIERS_PROPERTY_TYPE_VALUES.has(currentValue) ? currentValue : 'Other';
            const isSelected = effectiveValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`
                  w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors
                  ${isSelected
                    ? 'bg-secondary/10 text-secondary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handlePropertyTypeSelect(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PropertyTypeFilter;
