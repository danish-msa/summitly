"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapYearBuiltFilterProps extends FilterComponentProps {
  subjectYearBuilt?: number;
}

export const MapYearBuiltFilter: React.FC<MapYearBuiltFilterProps> = ({
  filters,
  handleFilterChange,
  subjectYearBuilt
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');

  const handleMinMaxChange = () => {
    const min = minYear ? parseInt(minYear) : 0;
    const max = maxYear ? parseInt(maxYear) : 0;
    
    if (subjectYearBuilt !== undefined) {
      const actualMin = min !== 0 ? subjectYearBuilt + min : 0;
      const actualMax = max !== 0 ? subjectYearBuilt + max : 0;
      handleFilterChange({
        target: {
          name: 'yearBuilt',
          value: actualMin > 0 ? actualMin.toString() : 'all'
        }
      });
    } else {
      handleFilterChange({
        target: {
          name: 'yearBuilt',
          value: min > 0 ? min.toString() : 'all'
        }
      });
    }
  };

  return (
    <MapFilterItem
      title="Year Built"
      subjectValue={subjectYearBuilt}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minYear}
            onChange={(e) => {
              setMinYear(e.target.value);
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
            value={maxYear}
            onChange={(e) => {
              setMaxYear(e.target.value);
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
