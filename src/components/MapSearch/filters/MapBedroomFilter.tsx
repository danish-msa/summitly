"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapBedroomFilterProps extends FilterComponentProps {
  subjectBedrooms?: number; // Reference property bedrooms (e.g., 4)
}

export const MapBedroomFilter: React.FC<MapBedroomFilterProps> = ({
  filters,
  handleFilterChange,
  subjectBedrooms
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minBedrooms, setMinBedrooms] = useState<string>('');
  const [maxBedrooms, setMaxBedrooms] = useState<string>('');

  const handleQuickSelect = (value: number) => {
    if (subjectBedrooms !== undefined) {
      const newValue = subjectBedrooms + value;
      handleFilterChange({
        target: {
          name: 'bedrooms',
          value: Math.max(0, newValue)
        }
      });
    } else {
      handleFilterChange({
        target: {
          name: 'bedrooms',
          value: value
        }
      });
    }
  };

  const handleMinMaxChange = () => {
    const min = minBedrooms ? parseInt(minBedrooms) : 0;
    const max = maxBedrooms ? parseInt(maxBedrooms) : 0;
    
    if (subjectBedrooms !== undefined) {
      // Relative to subject
      const actualMin = min !== 0 ? subjectBedrooms + min : 0;
      const actualMax = max !== 0 ? subjectBedrooms + max : 0;
      // For now, use min as the filter value
      handleFilterChange({
        target: {
          name: 'bedrooms',
          value: actualMin
        }
      });
    } else {
      handleFilterChange({
        target: {
          name: 'bedrooms',
          value: min
        }
      });
    }
  };

  return (
    <MapFilterItem
      title="Bedrooms"
      subjectValue={subjectBedrooms}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleQuickSelect(0)}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
        >
          0
        </button>
        {subjectBedrooms !== undefined && (
          <>
            <button
              onClick={() => handleQuickSelect(-1)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
            >
              +/- 1
            </button>
            <button
              onClick={() => handleQuickSelect(-2)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
            >
              +/- 2
            </button>
            <button
              onClick={() => handleQuickSelect(-3)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
            >
              +/- 3
            </button>
          </>
        )}
      </div>

      {/* Min/Max Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minBedrooms}
            onChange={(e) => {
              setMinBedrooms(e.target.value);
              handleMinMaxChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          <label className="text-xs text-gray-400 mt-1 block">— from subject</label>
        </div>
        <span className="text-gray-400">-</span>
        <div className="flex-1">
          <input
            type="number"
            placeholder="Max"
            value={maxBedrooms}
            onChange={(e) => {
              setMaxBedrooms(e.target.value);
              handleMinMaxChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          <label className="text-xs text-gray-400 mt-1 block">— from subject</label>
        </div>
      </div>
    </MapFilterItem>
  );
};
