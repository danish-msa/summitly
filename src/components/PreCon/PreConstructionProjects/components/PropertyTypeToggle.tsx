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
      {/* Mobile: Horizontal scrollable container */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <div className="flex flex-nowrap md:flex-wrap gap-3 min-w-max md:min-w-0">
          {propertyTypes.map((type) => {
            const isActive = filters.propertyType === type;
            return (
              <button
                key={type}
                onClick={() => handleTypeClick(type)}
                className={cn(
                  "border border-muted px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 shadow-sm flex-shrink-0 whitespace-nowrap",
                  "hover:scale-105",
                  isActive
                    ? "bg-secondary text-white border-secondary shadow-md"
                    : "bg-white text-foreground hover:bg-secondary/5"
                )}
              >
                {type}
              </button>
            );
          })}
          {filters.propertyType && filters.propertyType !== 'all' && (
            <button
              onClick={() => handleTypeClick('all')}
              className="px-3 py-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyTypeToggle;

