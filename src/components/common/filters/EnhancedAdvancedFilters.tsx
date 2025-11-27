// Enhanced AdvancedFilters with better animations and features
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FilterState, PROPERTY_TYPES } from '@/lib/types/filters';

interface EnhancedAdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (e: { target: { name: string; value: string | number | string[] } }) => void;
  onApplyFilters: () => void;
  onResetAdvanced: () => void;
  isPreCon?: boolean; // Flag to show pre-construction specific filters
}

// Pre-Construction Property Types (matching schema exactly)
const PRECON_PROPERTY_TYPES = [
  { value: 'Condos', label: 'Condos' },
  { value: 'Houses', label: 'Houses' },
  { value: 'Lofts', label: 'Lofts' },
  { value: 'Master-Planned Communities', label: 'Master-Planned Communities' },
  { value: 'Multi Family', label: 'Multi Family' },
  { value: 'Offices', label: 'Offices' },
];

// House type options (for Houses property type) - matching schema
const HOUSE_TYPES = [
  { value: 'all', label: 'All House Types' },
  { value: 'Link', label: 'Link' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Semi-Detached', label: 'Semi-Detached' },
  { value: 'Detached', label: 'Detached' },
];

// Condo type options (for Condos property type) - matching schema
const CONDO_TYPES = [
  { value: 'all', label: 'All Condo Types' },
  { value: 'Low-Rise', label: 'Low-Rise' },
  { value: 'Mid-Rise', label: 'Mid-Rise' },
  { value: 'High-Rise', label: 'High-Rise' },
];

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

// Generate completion date options
const generateCompletionDates = () => {
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

const COMPLETION_DATES = generateCompletionDates();

// Unit type options
const unitTypeOptions = [
  { value: 'Den', label: 'Den' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Loft', label: 'Loft' },
  { value: 'Work/Live Loft', label: 'Work/Live Loft' },
];

// Basement options
const basementOptions = [
  { value: 'all', label: 'All' },
  { value: 'finished', label: 'Finished' },
  { value: 'unfinished', label: 'Unfinished' },
];

export const EnhancedAdvancedFilters: React.FC<EnhancedAdvancedFiltersProps> = ({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetAdvanced,
  isPreCon = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [showPropertySubmenu, setShowPropertySubmenu] = useState(false);
  const [developers, setDevelopers] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'All Developers' }
  ]);
  const filtersRef = useRef(filters);
  
  // Keep filtersRef in sync with filters prop
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Get navbar height
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('[class*="z-[99]"]') as HTMLElement;
      if (navbar) {
        const height = navbar.offsetHeight;
        setNavbarHeight(height);
      } else {
        const isMobile = window.innerWidth < 1024;
        setNavbarHeight(isMobile ? 56 : 64);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, []);

  // Fetch developers
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/admin/developers?limit=1000');
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
        } else {
          console.error('Failed to fetch developers:', response.status);
        }
      } catch (error) {
        console.error('Error fetching developers:', error);
        // Set a default option if fetch fails
        setDevelopers([{ value: 'all', label: 'All Developers' }]);
      }
    };

    fetchDevelopers();
  }, []);

  // Close panel when clicking outside
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

  // Handle property type selection
  const handlePropertyTypeSelect = (value: string, checked: boolean) => {
    const newValue = checked ? value : 'all';
    onFilterChange({ 
      target: { 
        name: 'propertyType', 
        value: newValue
      } 
    });
    
    // For non-pre-con: Check if it's Houses or Condos (matching schema values)
    // For pre-con: Check if it's house or condo (lowercase)
    const hasSubmenu = !isPreCon 
      ? (newValue === 'Houses' || newValue === 'Condos')
      : (newValue === 'house' || newValue === 'condo');
    
    if (hasSubmenu) {
      setShowPropertySubmenu(true);
    } else {
      setShowPropertySubmenu(false);
      // Reset subPropertyType when changing away from house/condo
      if (filters.subPropertyType && filters.subPropertyType !== 'all') {
        onFilterChange({
          target: {
            name: 'subPropertyType',
            value: 'all'
          }
        });
      }
    }
  };

  // Handle sub-property type selection
  const handleSubPropertyTypeSelect = (value: string, checked: boolean) => {
    const newValue = checked ? value : 'all';
    onFilterChange({
      target: {
        name: 'subPropertyType',
        value: newValue
      }
    });
  };

  // Count active filters
  const activeFiltersCount = [
    filters.propertyType !== 'all',
    filters.subPropertyType && filters.subPropertyType !== 'all',
    filters.constructionStatus && filters.constructionStatus !== 'all',
    filters.preConStatus && filters.preConStatus !== 'all',
    filters.completionDate && filters.completionDate !== 'all',
    filters.developer && filters.developer !== 'all',
    filters.bedrooms !== 0,
    filters.bathrooms !== 0,
    (filters.minSquareFeet || 0) > 0,
    (filters.maxSquareFeet || 0) > 0,
    filters.minPrice > 0,
    filters.maxPrice < 2000000,
    filters.basement && filters.basement !== 'all',
    (filters.unitTypes?.length || 0) > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* Enhanced Advanced Filters Button */}
      <div className="relative w-full sm:w-auto">
        <Button
          ref={buttonRef}
          variant="outline"
          onClick={() => onOpenChange(!open)}
          className="relative flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-secondary hover:bg-gray-50 transition-all group"
        >
          <Filter className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          <span className="text-sm">Advanced</span>
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
        </Button>
      </div>

      {/* Inline Expandable Advanced Filters Panel - Full Width with Modern Design */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      )}
      <div
        ref={panelRef}
        className={`
          fixed left-1/2 -translate-x-1/2 w-[95%] z-50
          bg-white rounded-2xl shadow-2xl border border-gray-200
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${open 
            ? 'max-h-[85vh] opacity-100 visible translate-y-0' 
            : 'max-h-0 opacity-0 invisible -translate-y-4 pointer-events-none'
          }
        `}
        style={{
          top: `${navbarHeight + 12}px`
        }}
      >
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-bold text-primary">Advanced Filters</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Refine your search with detailed criteria
                </p>
              </div>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              {/* Property Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Property Type</Label>
                <div className="space-y-2">
                  {/* Use pre-con property types for non-pre-con, regular PROPERTY_TYPES for pre-con */}
                  {(!isPreCon ? PRECON_PROPERTY_TYPES : PROPERTY_TYPES.filter(pt => pt.value !== 'all')).map((type) => {
                    const isChecked = filters.propertyType === type.value;
                    return (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`prop-${type.value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handlePropertyTypeSelect(type.value, checked === true)}
                        />
                        <label
                          htmlFor={`prop-${type.value}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {type.label}
                        </label>
                      </div>
                    );
                  })}
                  
                  {/* Submenu for House/Condo - matching schema values */}
                  {((!isPreCon && (filters.propertyType === 'Houses' || filters.propertyType === 'Condos')) ||
                    (isPreCon && (filters.propertyType === 'house' || filters.propertyType === 'condo'))) && (
                    <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                      {((!isPreCon && filters.propertyType === 'Houses') || (isPreCon && filters.propertyType === 'house') 
                        ? HOUSE_TYPES 
                        : CONDO_TYPES).map((subType) => {
                        const isChecked = (filters.subPropertyType || 'all') === subType.value;
                        return (
                          <div key={subType.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subprop-${subType.value}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleSubPropertyTypeSelect(subType.value, checked === true)}
                            />
                            <label
                              htmlFor={`subprop-${subType.value}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {subType.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Construction Status */}
              <div className="space-y-2">
                <Label htmlFor="constructionStatus" className="text-sm font-semibold">
                  Construction Status
                </Label>
                <select
                  id="constructionStatus"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.constructionStatus || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'constructionStatus', value: e.target.value } })}
                >
                  {CONSTRUCTION_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selling Status */}
              <div className="space-y-2">
                <Label htmlFor="sellingStatus" className="text-sm font-semibold">
                  Selling Status
                </Label>
                <select
                  id="sellingStatus"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.preConStatus || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'preConStatus', value: e.target.value } })}
                >
                  {SELLING_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Completion Date */}
              <div className="space-y-2">
                <Label htmlFor="completionDate" className="text-sm font-semibold">
                  Completion Date
                </Label>
                <select
                  id="completionDate"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.completionDate || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'completionDate', value: e.target.value } })}
                >
                  {COMPLETION_DATES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Developer */}
              <div className="space-y-2">
                <Label htmlFor="developer" className="text-sm font-semibold">
                  Developer
                </Label>
                <select
                  id="developer"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.developer || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    onFilterChange({ target: { name: 'developer', value } });
                  }}
                >
                  {developers.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              {/* Beds */}
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-sm font-semibold">Beds</Label>
                <select
                  id="bedrooms"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.bedrooms || 0}
                  onChange={(e) => onFilterChange({ target: { name: 'bedrooms', value: parseInt(e.target.value) || 0 } })}
                >
                  <option value={0}>Any</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5+</option>
                </select>
              </div>

              {/* Baths */}
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-sm font-semibold">Baths</Label>
                <select
                  id="bathrooms"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.bathrooms || 0}
                  onChange={(e) => onFilterChange({ target: { name: 'bathrooms', value: parseInt(e.target.value) || 0 } })}
                >
                  <option value={0}>Any</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4+</option>
                </select>
              </div>

              {/* Square Foot Range */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Square Foot Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minSquareFeet || ""}
                      onChange={(e) =>
                        onFilterChange({ 
                          target: { 
                            name: 'minSquareFeet', 
                            value: parseInt(e.target.value) || 0 
                          } 
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSquareFeet || ""}
                      onChange={(e) =>
                        onFilterChange({ 
                          target: { 
                            name: 'maxSquareFeet', 
                            value: parseInt(e.target.value) || 0 
                          } 
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Price</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ""}
                      onChange={(e) =>
                        onFilterChange({ 
                          target: { 
                            name: 'minPrice', 
                            value: parseInt(e.target.value) || 0 
                          } 
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ""}
                      onChange={(e) =>
                        onFilterChange({ 
                          target: { 
                            name: 'maxPrice', 
                            value: parseInt(e.target.value) || 2000000 
                          } 
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Basement */}
              <div className="space-y-2">
                <Label htmlFor="basement" className="text-sm font-semibold">
                  Basement
                </Label>
                <select
                  id="basement"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.basement || 'all'}
                  onChange={(e) => onFilterChange({ target: { name: 'basement', value: e.target.value } })}
                >
                  {basementOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
                {/* Unit Types Available */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Unit Types Available</Label>
                  <div className="space-y-2">
                    {unitTypeOptions.map((unitType) => {
                      const unitTypesArray = Array.isArray(filters.unitTypes) ? filters.unitTypes : [];
                      const isChecked = unitTypesArray.includes(unitType.value);
                      return (
                        <div key={unitType.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`unitType-${unitType.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              // Use ref to get the latest state to avoid stale closures
                              const latestFilters = filtersRef.current;
                              const current = Array.isArray(latestFilters.unitTypes) ? [...latestFilters.unitTypes] : [];
                              const shouldAdd = checked === true;
                              
                              // Prevent duplicate operations
                              if (shouldAdd && current.includes(unitType.value)) {
                                return; // Already in array, no need to update
                              }
                              if (!shouldAdd && !current.includes(unitType.value)) {
                                return; // Not in array, no need to update
                              }
                              
                              const updated = shouldAdd
                                ? [...current, unitType.value]
                                : current.filter((item) => item !== unitType.value);
                              
                              onFilterChange({ target: { name: 'unitTypes', value: updated } });
                            }}
                          />
                          <label
                            htmlFor={`unitType-${unitType.value}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {unitType.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Available Units */}
                <div className="space-y-2">
                  <Label htmlFor="availableUnits" className="text-sm font-semibold">
                    Available Units
                  </Label>
                  <Input
                    id="availableUnits"
                    type="number"
                    placeholder="Min available units"
                    value={filters.availableUnits || ""}
                    onChange={(e) =>
                      onFilterChange({ 
                        target: { 
                          name: 'availableUnits', 
                          value: parseInt(e.target.value) || 0 
                        } 
                      })
                    }
                    className="text-sm"
                  />
                </div>

                {/* Suites */}
                <div className="space-y-2">
                  <Label htmlFor="suites" className="text-sm font-semibold">
                    Suites
                  </Label>
                  <Input
                    id="suites"
                    type="number"
                    placeholder="Number of suites"
                    value={filters.suites || ""}
                    onChange={(e) =>
                      onFilterChange({ 
                        target: { 
                          name: 'suites', 
                          value: parseInt(e.target.value) || 0 
                        } 
                      })
                    }
                    className="text-sm"
                  />
                </div>

                {/* Storeys */}
                <div className="space-y-2">
                  <Label htmlFor="storeys" className="text-sm font-semibold">
                    Storeys
                  </Label>
                  <Input
                    id="storeys"
                    type="number"
                    placeholder="Number of storeys"
                    value={filters.storeys || ""}
                    onChange={(e) =>
                      onFilterChange({ 
                        target: { 
                          name: 'storeys', 
                          value: parseInt(e.target.value) || 0 
                        } 
                      })
                    }
                    className="text-sm"
                  />
                </div>
              </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t">
            <Button
              variant="outline"
              onClick={onResetAdvanced}
              className="flex-1"
            >
              Reset Advanced
            </Button>
            <Button
              onClick={() => {
                onApplyFilters();
                onOpenChange(false);
              }}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedAdvancedFilters;
