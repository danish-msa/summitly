"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapListPriceFilterProps extends FilterComponentProps {
  subjectListPrice?: number;
}

export const MapListPriceFilter: React.FC<MapListPriceFilterProps> = ({
  filters,
  handleFilterChange,
  subjectListPrice
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const handlePriceChange = () => {
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : 0;
    
    if (subjectListPrice !== undefined) {
      const actualMin = min !== 0 ? subjectListPrice + min : 0;
      const actualMax = max !== 0 ? subjectListPrice + max : 0;
      handleFilterChange({
        target: {
          name: 'minPrice',
          value: actualMin
        }
      });
      if (actualMax > 0) {
        handleFilterChange({
          target: {
            name: 'maxPrice',
            value: actualMax
          }
        });
      }
    } else {
      handleFilterChange({
        target: {
          name: 'minPrice',
          value: min
        }
      });
      if (max > 0) {
        handleFilterChange({
          target: {
            name: 'maxPrice',
          value: max
          }
        });
      }
    }
  };

  return (
    <MapFilterItem
      title="List Price"
      subjectValue={subjectListPrice ? `$${subjectListPrice.toLocaleString()}` : undefined}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              handlePriceChange();
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
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              handlePriceChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          <label className="text-xs text-gray-400 mt-1 block">— from subject</label>
        </div>
      </div>
    </MapFilterItem>
  );
};
