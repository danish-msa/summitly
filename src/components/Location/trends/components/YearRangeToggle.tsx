"use client";

import React from 'react';

interface YearRangeToggleProps {
  selectedYears: number;
  onYearsChange: (years: number) => void;
}

const YEAR_OPTIONS = [5, 10, 15, 20];

export const YearRangeToggle: React.FC<YearRangeToggleProps> = ({
  selectedYears,
  onYearsChange,
}) => {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
      {YEAR_OPTIONS.map((years) => (
        <button
          key={years}
          onClick={() => onYearsChange(years)}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            ${
              selectedYears === years
                ? 'bg-white text-foreground shadow-sm'
                : 'text-gray-600 hover:text-foreground'
            }
          `}
        >
          {years} Years
        </button>
      ))}
    </div>
  );
};

