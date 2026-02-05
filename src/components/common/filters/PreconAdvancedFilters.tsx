"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Filter, X, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterState } from '@/lib/types/filters';
import { PillSelector } from '@/components/ui/pill-selector';
import { RangeSlider } from '@/components/ui/range-slider';
import { PropertyTypeSelector } from './PropertyTypeSelector';
import { cn } from '@/lib/utils';
import { 
  DoorOpen, 
  Home, 
  Warehouse, 
  Briefcase 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreconAdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (e: { target: { name: string; value: string | number | string[] } }) => void;
  onApplyFilters: () => void;
  onResetAdvanced: () => void;
}

// Construction status options
const CONSTRUCTION_STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: '0', label: 'Pre-Construction' },
  { value: '1', label: 'Under Construction' },
  { value: '2', label: 'Completed' },
];

// Selling status options
const SELLING_STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'selling', label: 'Selling Now' },
  { value: 'coming-soon', label: 'Coming Soon' },
  { value: 'sold-out', label: 'Sold Out' },
];

// Generate occupancy date options
const generateOccupancyDates = () => {
  const currentYear = new Date().getFullYear();
  const dates = [{ value: 'all', label: 'All Dates' }];
  for (let year = currentYear; year <= currentYear + 10; year++) {
    dates.push(
      { value: `Q1 ${year}`, label: `Q1 ${year}` },
      { value: `Q2 ${year}`, label: `Q2 ${year}` },
      { value: `Q3 ${year}`, label: `Q3 ${year}` },
      { value: `Q4 ${year}`, label: `Q4 ${year}` }
    );
  }
  return dates;
};

const OCCUPANCY_DATES = generateOccupancyDates();

// Unit type options with icons
const unitTypeOptions = [
  { value: 'Den', label: 'Den', icon: DoorOpen },
  { value: 'Studio', label: 'Studio', icon: Home },
  { value: 'Loft', label: 'Loft', icon: Warehouse },
  { value: 'Work/Live Loft', label: 'Work/Live Loft', icon: Briefcase },
];

// Basement options
const basementOptions = [
  { value: 'all', label: 'All' },
  { value: 'finished', label: 'Finished' },
  { value: 'unfinished', label: 'Unfinished' },
];

// Locker options
const lockerOptions = [
  { value: 'all', label: 'Any' },
  { value: 'has', label: 'Has locker' },
  { value: 'no', label: 'No Locker' },
];

// Balcony options
const balconyOptions = [
  { value: 'all', label: 'Any' },
  { value: 'has', label: 'Has Balcony' },
  { value: 'no', label: 'No Balcony' },
];

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

export const PreconAdvancedFilters: React.FC<PreconAdvancedFiltersProps> = ({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetAdvanced,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [developers, setDevelopers] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'All Developers' }
  ]);
  const filtersRef = useRef(filters);
  
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

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
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/admin/development-team?limit=1000');
        if (response.ok) {
          const data = await response.json();
          const developerList = [
            { value: 'all', label: 'All Developers' },
            ...(data.developers || []).map((dev: { id: string; name: string }) => ({
              value: dev.id,
              label: dev.name
            }))
          ];
          setDevelopers(developerList);
        }
      } catch (error) {
        console.error('Error fetching developers:', error);
      }
    };
    fetchDevelopers();
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
    filters.subPropertyType && filters.subPropertyType !== 'all',
    filters.constructionStatus && filters.constructionStatus !== 'all',
    filters.preConStatus && filters.preConStatus !== 'all',
    filters.occupancyDate && filters.occupancyDate !== 'all',
    filters.developer && filters.developer !== 'all',
    filters.bedrooms !== 0,
    filters.bathrooms !== 0,
    (filters.minSquareFeet || 0) > 0,
    (filters.maxSquareFeet || 0) > 0 && (filters.maxSquareFeet || 0) < 8000,
    filters.minPrice > 0,
    filters.maxPrice < 2000000,
    filters.basement && filters.basement !== 'all',
    filters.locker && filters.locker !== 'all',
    filters.balcony && filters.balcony !== 'all',
    (filters.unitTypes?.length || 0) > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* Advanced Filters Button */}
      <div className="relative w-full sm:w-auto">
        <button
          ref={buttonRef}
          onClick={() => onOpenChange(!open)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all ${open ? 'border-2 border-secondary text-primary' : 'border border-gray-300 text-primary'} hover:border-secondary`}
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

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      )}

      {/* Filter Panel */}
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">Pre-Construction Advanced Filters</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Refine your pre-construction search with detailed criteria
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Property Type */}
              <PropertyTypeSelector
                value={filters.propertyType || 'all'}
                subValue={filters.subPropertyType || 'all'}
                onChange={(value) => {
                  onFilterChange({ target: { name: 'propertyType', value } });
                  if (value === 'all' || !['Condos', 'Houses'].includes(value)) {
                    onFilterChange({ target: { name: 'subPropertyType', value: 'all' } });
                  }
                }}
                onSubChange={(value) => onFilterChange({ target: { name: 'subPropertyType', value } })}
              />

              {/* Status Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Construction Status</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={filters.constructionStatus || 'all'}
                    onChange={(e) => onFilterChange({ target: { name: 'constructionStatus', value: e.target.value } })}
                  >
                    {CONSTRUCTION_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Selling Status</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={filters.preConStatus || 'all'}
                    onChange={(e) => onFilterChange({ target: { name: 'preConStatus', value: e.target.value } })}
                  >
                    {SELLING_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Occupancy Date & Developer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Occupancy Date</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={filters.occupancyDate || 'all'}
                    onChange={(e) => onFilterChange({ target: { name: 'occupancyDate', value: e.target.value } })}
                  >
                    {OCCUPANCY_DATES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Developer</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={filters.developer || 'all'}
                    onChange={(e) => onFilterChange({ target: { name: 'developer', value: e.target.value } })}
                  >
                    {developers.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
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

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Unit Types Available</Label>
                <div className="grid grid-cols-4 gap-2">
                  {unitTypeOptions.map((unitType) => {
                    const Icon = unitType.icon;
                    const unitTypesArray = Array.isArray(filters.unitTypes) ? filters.unitTypes : [];
                    const isChecked = unitTypesArray.includes(unitType.value);
                    return (
                      <button
                        key={unitType.value}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(filtersRef.current.unitTypes) ? [...filtersRef.current.unitTypes] : [];
                          const shouldAdd = !isChecked;
                          if (shouldAdd && current.includes(unitType.value)) return;
                          if (!shouldAdd && !current.includes(unitType.value)) return;
                          const updated = shouldAdd
                            ? [...current, unitType.value]
                            : current.filter((item) => item !== unitType.value);
                          onFilterChange({ target: { name: 'unitTypes', value: updated } });
                        }}
                        className={cn(
                          "property-card relative",
                          isChecked ? "property-card-active" : "property-card-inactive"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mb-1.5 transition-colors",
                          isChecked ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "text-xs font-medium text-center leading-tight",
                          isChecked ? "text-primary" : "text-foreground"
                        )}>
                          {unitType.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Basement</Label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.basement || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'basement', value: e.target.value } })}
                >
                  {basementOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold text-foreground">Condo Includes:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Locker</Label>
                    <select
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={filters.locker || 'all'}
                      onChange={(e) => onFilterChange({ target: { name: 'locker', value: e.target.value } })}
                    >
                      {lockerOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Balcony</Label>
                    <select
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={filters.balcony || 'all'}
                      onChange={(e) => onFilterChange({ target: { name: 'balcony', value: e.target.value } })}
                    >
                      {balconyOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Available Units</Label>
                  <Input
                    type="number"
                    placeholder="Min units"
                    value={filters.availableUnits || ""}
                    onChange={(e) => onFilterChange({ target: { name: 'availableUnits', value: parseInt(e.target.value) || 0 } })}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Suites</Label>
                  <Input
                    type="number"
                    placeholder="# of suites"
                    value={filters.suites || ""}
                    onChange={(e) => onFilterChange({ target: { name: 'suites', value: parseInt(e.target.value) || 0 } })}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Storeys</Label>
                  <Input
                    type="number"
                    placeholder="# of storeys"
                    value={filters.storeys || ""}
                    onChange={(e) => onFilterChange({ target: { name: 'storeys', value: parseInt(e.target.value) || 0 } })}
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PreconAdvancedFilters;
