"use client";

import React, { useMemo } from 'react';
import { FilterState } from '@/lib/types/filters';
import { cn } from '@/lib/utils';

interface PropertyTypeToggleProps {
  filters: FilterState;
  handleFilterChange: (e: { target: { name: string; value: string } }) => void;
  projects: Array<{ details: { propertyType: string } }>;
}

const PropertyTypeToggle: React.FC<PropertyTypeToggleProps> = ({
  filters,
  handleFilterChange,
  projects
}) => {
  // Get unique property types from projects
  const propertyTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach(project => {
      if (project.details?.propertyType) {
        types.add(project.details.propertyType);
      }
    });
    return Array.from(types).sort();
  }, [projects]);

  const handleTypeClick = (type: string) => {
    const newValue = filters.propertyType === type ? 'all' : type;
    handleFilterChange({
      target: {
        name: 'propertyType',
        value: newValue
      }
    });
  };

  if (propertyTypes.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 mb-4">
      <div className="flex flex-wrap ml-2 justify-center items-center gap-3">
        {propertyTypes.map((type) => {
          const isActive = filters.propertyType === type;
          return (
            <button
              key={type}
              onClick={() => handleTypeClick(type)}
              className={cn(
                "px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 border border-gray-300",
                "hover:scale-105",
                isActive
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white text-foreground hover:bg-primary/5"
              )}
            >
              {type}
            </button>
          );
        })}
        {filters.propertyType && filters.propertyType !== 'all' && (
          <button
            onClick={() => handleTypeClick('all')}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyTypeToggle;

