"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapLotSizeFilterProps extends FilterComponentProps {
  subjectLotSize?: number;
}

export const MapLotSizeFilter: React.FC<MapLotSizeFilterProps> = ({
  filters,
  handleFilterChange,
  subjectLotSize
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minLotSize, setMinLotSize] = useState<string>('');
  const [maxLotSize, setMaxLotSize] = useState<string>('');

  const handleMinMaxChange = () => {
    const min = minLotSize ? parseInt(minLotSize) : 0;
    const max = maxLotSize ? parseInt(maxLotSize) : 0;
    
    if (subjectLotSize !== undefined) {
      const actualMin = min !== 0 ? subjectLotSize + min : 0;
      const actualMax = max !== 0 ? subjectLotSize + max : 0;
      // You can add a specific filter field for lot size if needed
    }
  };

  return (
    <MapFilterItem
      title="Lot Size"
      subjectValue={subjectLotSize ? `${subjectLotSize.toLocaleString()} sqft` : undefined}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minLotSize}
            onChange={(e) => {
              setMinLotSize(e.target.value);
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
            value={maxLotSize}
            onChange={(e) => {
              setMaxLotSize(e.target.value);
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
