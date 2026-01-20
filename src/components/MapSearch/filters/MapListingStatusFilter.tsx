"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapListingStatusFilterProps extends FilterComponentProps {
  subjectStatus?: string; // Reference property status
}

const LISTING_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'pending', label: 'Pending', color: 'bg-orange-500' },
  { value: 'closed', label: 'Closed', color: 'bg-red-500' },
];

export const MapListingStatusFilter: React.FC<MapListingStatusFilterProps> = ({
  filters,
  handleFilterChange,
  subjectStatus
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const handleStatusChange = (value: string) => {
    const newStatuses = selectedStatuses.includes(value)
      ? selectedStatuses.filter(s => s !== value)
      : [...selectedStatuses, value];
    
    setSelectedStatuses(newStatuses);
    // You can update filters here if needed
    // For now, we'll just track the selection
  };

  return (
    <MapFilterItem
      title="Listing Status"
      subjectValue={subjectStatus ? subjectStatus.charAt(0).toUpperCase() + subjectStatus.slice(1) : undefined}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="space-y-2">
        {LISTING_STATUSES.map((status) => {
          const isSelected = selectedStatuses.includes(status.value);
          
          return (
            <label
              key={status.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleStatusChange(status.value)}
                className="w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary/20"
              />
              <div className={`w-3 h-3 rounded-full ${status.color}`} />
              <span className="text-sm text-gray-700">{status.label}</span>
            </label>
          );
        })}
      </div>
    </MapFilterItem>
  );
};
