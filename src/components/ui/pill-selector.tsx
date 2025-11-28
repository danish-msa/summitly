import React from 'react';
import { cn } from '@/lib/utils';

interface PillOption {
  value: number | string;
  label: string;
}

interface PillSelectorProps {
  label: string;
  options: PillOption[];
  value: number | string;
  onChange: (value: number | string) => void;
}

export const PillSelector: React.FC<PillSelectorProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "filter-pill h-10 min-w-[44px] px-4 text-sm font-medium rounded-full",
                isActive ? "filter-pill-active" : "filter-pill-inactive"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PillSelector;

