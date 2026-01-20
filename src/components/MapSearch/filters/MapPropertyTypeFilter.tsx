"use client";

import React, { useState } from 'react';
import { MapFilterItem } from './MapFilterItem';
import { FilterComponentProps } from '@/lib/types/filters';

interface MapPropertyTypeFilterProps extends FilterComponentProps {
  subjectPropertyType?: string; // Reference property type
}

const PROPERTY_TYPES = [
  { value: 'Single Family Detached', label: 'Single Family Detached' },
  { value: 'Condominium', label: 'Condominium' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Multifamily', label: 'Multifamily' },
  { value: 'Manufactured', label: 'Manufactured' },
];

export const MapPropertyTypeFilter: React.FC<MapPropertyTypeFilterProps> = ({
  filters,
  handleFilterChange,
  subjectPropertyType
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeChange = (value: string) => {
    handleFilterChange({
      target: {
        name: 'propertyType',
        value: value
      }
    });
  };

  return (
    <MapFilterItem
      title="Property Type"
      subjectValue={subjectPropertyType}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onClose={() => setIsExpanded(false)}
    >
      <div className="space-y-2">
        {PROPERTY_TYPES.map((type) => {
          const isSubject = type.value === subjectPropertyType;
          const isSelected = filters.propertyType === type.value;
          
          return (
            <label
              key={type.value}
              className={`flex items-center gap-2 cursor-pointer ${
                isSubject ? 'opacity-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleTypeChange(type.value)}
                disabled={isSubject}
                className="w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary/20"
              />
              <span className="text-sm text-gray-700">
                {type.label}
                {isSubject && (
                  <span className="text-xs text-gray-400 ml-1">(Subject property match)</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </MapFilterItem>
  );
};
