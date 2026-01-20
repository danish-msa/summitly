"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapDistanceFilterProps extends FilterComponentProps {
  subjectLocation?: { lat: number; lng: number }; // Reference property location
}

export const MapDistanceFilter: React.FC<MapDistanceFilterProps> = ({
  filters,
  handleFilterChange,
  subjectLocation
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [distance, setDistance] = useState<string>('');

  const handleDistanceChange = (value: string) => {
    setDistance(value);
    // You can implement distance filtering logic here
  };

  return (
    <MapFilterItem
      title="Distance"
      subjectValue={subjectLocation ? "Current location" : undefined}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Distance in km"
          value={distance}
          onChange={(e) => handleDistanceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
        />
        <label className="text-xs text-gray-400">Maximum distance from subject property</label>
      </div>
    </MapFilterItem>
  );
};
