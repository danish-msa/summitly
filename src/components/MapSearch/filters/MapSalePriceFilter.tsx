"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapSalePriceFilterProps extends FilterComponentProps {
  subjectSalePrice?: number;
}

export const MapSalePriceFilter: React.FC<MapSalePriceFilterProps> = ({
  filters,
  handleFilterChange,
  subjectSalePrice
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const handlePriceChange = () => {
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : 0;
    
    if (subjectSalePrice !== undefined) {
      const actualMin = min !== 0 ? subjectSalePrice + min : 0;
      const actualMax = max !== 0 ? subjectSalePrice + max : 0;
      // You can add a specific filter field for sale price if needed
    }
  };

  return (
    <MapFilterItem
      title="Sale Price"
      subjectValue={subjectSalePrice ? `$${subjectSalePrice.toLocaleString()}` : undefined}
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
