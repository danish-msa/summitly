"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapBathroomFilterProps extends FilterComponentProps {
  subjectBathrooms?: number; // Reference property bathrooms
}

export const MapBathroomFilter: React.FC<MapBathroomFilterProps> = ({
  filters,
  handleFilterChange,
  subjectBathrooms
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minBathrooms, setMinBathrooms] = useState<string>('');
  const [maxBathrooms, setMaxBathrooms] = useState<string>('');

  const handleQuickSelect = (value: number) => {
    if (subjectBathrooms !== undefined) {
      const newValue = subjectBathrooms + value;
      handleFilterChange({
        target: {
          name: 'bathrooms',
          value: Math.max(0, newValue)
        }
      });
    } else {
      handleFilterChange({
        target: {
          name: 'bathrooms',
          value: value
        }
      });
    }
  };

  const handleMinMaxChange = () => {
    const min = minBathrooms ? parseInt(minBathrooms) : 0;
    const max = maxBathrooms ? parseInt(maxBathrooms) : 0;
    
    if (subjectBathrooms !== undefined) {
      const actualMin = min !== 0 ? subjectBathrooms + min : 0;
      const actualMax = max !== 0 ? subjectBathrooms + max : 0;
      handleFilterChange({
        target: {
          name: 'bathrooms',
          value: actualMin
        }
      });
    } else {
      handleFilterChange({
        target: {
          name: 'bathrooms',
          value: min
        }
      });
    }
  };

  return (
    <MapFilterItem
      title="Bathrooms"
      subjectValue={subjectBathrooms}
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
        {subjectBathrooms !== undefined && (
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
            value={minBathrooms}
            onChange={(e) => {
              setMinBathrooms(e.target.value);
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
            value={maxBathrooms}
            onChange={(e) => {
              setMaxBathrooms(e.target.value);
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
