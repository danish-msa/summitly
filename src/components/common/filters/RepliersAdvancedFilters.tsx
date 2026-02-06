"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Filter, X, ChevronDown, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FilterState,
  REPLIERS_PROPERTY_TYPE_OPTIONS,
  LAST_STATUS_OPTIONS,
  TIME_ON_SUMMITLY_OPTIONS,
  OPEN_HOUSE_FILTER_OPTIONS,
  GARAGE_SPACES_OPTIONS,
  PARKING_SPACES_OPTIONS,
  HAS_POOL_OPTIONS,
  FLOORING_TYPE_OPTIONS,
} from '@/lib/types/filters';
import { PillSelector } from '@/components/ui/pill-selector';
import { RangeSlider } from '@/components/ui/range-slider';
import { Button } from '@/components/ui/button';

const REPLIERS_PROPERTY_TYPE_VALUES = new Set(REPLIERS_PROPERTY_TYPE_OPTIONS.map((o) => o.value));
function propertyTypeSelectValue(apiValue: string | undefined): string {
  const v = apiValue || 'all';
  return REPLIERS_PROPERTY_TYPE_VALUES.has(v) ? v : 'Other';
}

interface RepliersAdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (e: { target: { name: string; value: string | number | string[] } }) => void;
  onApplyFilters: () => void;
  onResetAdvanced: () => void;
}

const BEDROOM_OPTIONS = [
  { value: 0, label: 'All' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5+' },
];

const BATHROOM_OPTIONS = [
  { value: 0, label: 'All' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5+' },
];

// Year built options for MLS/Repliers
const YEAR_BUILT_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: '0-5', label: '0–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10-20', label: '10–20 years' },
  { value: '20-50', label: '20–50 years' },
  { value: '50+', label: '50+ years' },
];

export const RepliersAdvancedFilters: React.FC<RepliersAdvancedFiltersProps> = ({
  open,
  onOpenChange,
  filters,
  onFilterChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(64);

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('[class*="z-[99]"]') as HTMLElement;
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      } else {
        setNavbarHeight(window.innerWidth < 1024 ? 56 : 64);
      }
    };
    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatSqft = (value: number) => {
    return value >= 8000 ? `${value}+` : value.toString();
  };

  const activeFiltersCount = [
    filters.propertyType !== 'all',
    filters.lastStatus && filters.lastStatus !== 'all',
    filters.yearBuilt && filters.yearBuilt !== 'all',
    filters.timeOnSummitly && filters.timeOnSummitly !== 'none',
    filters.openHouseFilter && filters.openHouseFilter !== 'any',
    !!filters.searchKeywords?.trim(),
    filters.bedrooms !== 0,
    filters.bathrooms !== 0,
    (filters.minGarageSpaces ?? 0) > 0,
    (filters.minParkingSpaces ?? 0) > 0,
    filters.hasPool === 'yes',
    filters.flooringType && filters.flooringType !== 'all',
    (filters.minSquareFeet || 0) > 0,
    (filters.maxSquareFeet || 0) > 0 && (filters.maxSquareFeet || 0) < 8000,
    filters.minPrice > 0,
    filters.maxPrice < 2000000,
  ].filter(Boolean).length;

  return (
    <>
      <div className="relative w-full sm:w-auto">
        <button
          ref={buttonRef}
          onClick={() => onOpenChange(!open)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground transition-all border border-transparent hover:opacity-90 ${open ? 'opacity-100' : ''}`}
        >
          <Filter className="h-4 w-4" />
          <span>Advanced</span>
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      )}

      <div
        ref={panelRef}
        className={`
          fixed left-1/2 -translate-x-1/2 w-[95%] z-50
          bg-card rounded-2xl shadow-2xl border border-border
          overflow-hidden
          transition-all duration-300 ease-out
          ${open
            ? 'max-h-[95vh] opacity-100 visible translate-y-0'
            : 'max-h-0 opacity-0 invisible -translate-y-4 pointer-events-none'
          }
        `}
        style={{ top: `${navbarHeight + 12}px` }}
      >
        <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(85vh-2rem)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">Advanced Filters</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Refine your listing search with detailed criteria
                </p>
              </div>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="default" className="h-9 px-4 py-2 rounded-lg bg-secondary text-primary-foreground hover:bg-secondary/90 transition-colors font-medium text-sm">Reset Filters</Button>
              <Button variant="default" className="h-9 px-4 py-2 rounded-lg bg-secondary text-primary-foreground hover:bg-secondary/90 transition-colors font-medium text-sm">Apply Filters</Button>
              <button type="button" onClick={() => onOpenChange(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" aria-label="Close">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Search by Keywords - full width */}
          <div className="mb-6">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4" aria-hidden />
              Search by Keywords
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              e.g. Swimming pool, Garage, Backyard, Open floor, Laundry room
            </p>
            <Input
              type="text"
              placeholder="Search in descriptions and features..."
              value={filters.searchKeywords ?? ''}
              onChange={(e) => onFilterChange({ target: { name: 'searchKeywords', value: e.target.value } })}
              className="h-10 rounded-lg"
              aria-label="Search by keywords"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Property Type</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={propertyTypeSelectValue(filters.propertyType)}
                  onChange={(e) => onFilterChange({ target: { name: 'propertyType', value: e.target.value } })}
                >
                  {REPLIERS_PROPERTY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Last Status</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.lastStatus || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'lastStatus', value: e.target.value } })}
                >
                  {LAST_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Year Built</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.yearBuilt || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'yearBuilt', value: e.target.value } })}
                >
                  {YEAR_BUILT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Time on Summitly</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.timeOnSummitly || 'none'}
                  onChange={(e) => onFilterChange({ target: { name: 'timeOnSummitly', value: e.target.value } })}
                >
                  {TIME_ON_SUMMITLY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Open House</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.openHouseFilter || 'any'}
                  onChange={(e) => onFilterChange({ target: { name: 'openHouseFilter', value: e.target.value } })}
                >
                  {OPEN_HOUSE_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              <PillSelector
                label="Bedrooms"
                options={BEDROOM_OPTIONS}
                value={filters.bedrooms}
                onChange={(value) => onFilterChange({ target: { name: 'bedrooms', value: value as number } })}
              />
              <PillSelector
                label="Bathrooms"
                options={BATHROOM_OPTIONS}
                value={filters.bathrooms}
                onChange={(value) => onFilterChange({ target: { name: 'bathrooms', value: value as number } })}
              />
              <RangeSlider
                label="Price"
                min={0}
                max={2000000}
                step={25000}
                minValue={filters.minPrice}
                maxValue={filters.maxPrice}
                onMinChange={(value) => onFilterChange({ target: { name: 'minPrice', value } })}
                onMaxChange={(value) => onFilterChange({ target: { name: 'maxPrice', value } })}
                formatValue={formatPrice}
              />
              <RangeSlider
                label="Square Footage (sqft)"
                min={0}
                max={8000}
                step={100}
                minValue={filters.minSquareFeet || 0}
                maxValue={filters.maxSquareFeet || 8000}
                onMinChange={(value) => onFilterChange({ target: { name: 'minSquareFeet', value } })}
                onMaxChange={(value) => onFilterChange({ target: { name: 'maxSquareFeet', value } })}
                formatValue={formatSqft}
              />
            </div>

            {/* Right Column - Garage, Parking, Pool, Flooring */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Garage Spaces</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.minGarageSpaces ?? 0}
                  onChange={(e) => onFilterChange({ target: { name: 'minGarageSpaces', value: Number(e.target.value) } })}
                >
                  {GARAGE_SPACES_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Parking Spaces</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.minParkingSpaces ?? 0}
                  onChange={(e) => onFilterChange({ target: { name: 'minParkingSpaces', value: Number(e.target.value) } })}
                >
                  {PARKING_SPACES_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Swimming Pool</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.hasPool || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'hasPool', value: e.target.value } })}
                >
                  {HAS_POOL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Flooring Type</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.flooringType || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'flooringType', value: e.target.value } })}
                >
                  {FLOORING_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RepliersAdvancedFilters;
