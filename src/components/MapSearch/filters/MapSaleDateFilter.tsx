"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapSaleDateFilterProps extends FilterComponentProps {
  subjectSaleDate?: string;
}

export const MapSaleDateFilter: React.FC<MapSaleDateFilterProps> = ({
  filters,
  handleFilterChange,
  subjectSaleDate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  const handleDateChange = () => {
    // You can implement date filtering logic here
  };

  return (
    <MapFilterItem
      title="Sale Date"
      subjectValue={subjectSaleDate}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={minDate}
            onChange={(e) => {
              setMinDate(e.target.value);
              handleDateChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <span className="text-gray-400">-</span>
        <div className="flex-1">
          <input
            type="date"
            value={maxDate}
            onChange={(e) => {
              setMaxDate(e.target.value);
              handleDateChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
      </div>
    </MapFilterItem>
  );
};
