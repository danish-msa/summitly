"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapSquareFeetFilterProps extends FilterComponentProps {
  subjectSquareFeet?: number; // Reference property square feet
}

export const MapSquareFeetFilter: React.FC<MapSquareFeetFilterProps> = ({
  filters,
  handleFilterChange,
  subjectSquareFeet
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minSqft, setMinSqft] = useState<string>('');
  const [maxSqft, setMaxSqft] = useState<string>('');

  const handleMinMaxChange = () => {
    const min = minSqft ? parseInt(minSqft) : 0;
    const max = maxSqft ? parseInt(maxSqft) : 0;
    
    if (subjectSquareFeet !== undefined) {
      const actualMin = min !== 0 ? subjectSquareFeet + min : 0;
      const actualMax = max !== 0 ? subjectSquareFeet + max : 0;
      handleFilterChange({
        target: {
          name: 'minSquareFeet',
          value: actualMin
        }
      });
      if (actualMax > 0) {
        handleFilterChange({
          target: {
            name: 'maxSquareFeet',
            value: actualMax
          }
        });
      }
    } else {
      handleFilterChange({
        target: {
          name: 'minSquareFeet',
          value: min
        }
      });
      if (max > 0) {
        handleFilterChange({
          target: {
            name: 'maxSquareFeet',
            value: max
          }
        });
      }
    }
  };

  return (
    <MapFilterItem
      title="Square Feet"
      subjectValue={subjectSquareFeet ? `${subjectSquareFeet.toLocaleString()} sqft` : undefined}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      {/* Min/Max Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minSqft}
            onChange={(e) => {
              setMinSqft(e.target.value);
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
            value={maxSqft}
            onChange={(e) => {
              setMaxSqft(e.target.value);
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
