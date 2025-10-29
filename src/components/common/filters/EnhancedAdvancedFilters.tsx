// Enhanced AdvancedFilters with better animations and features
"use client";

import React from 'react';
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FilterState } from '@/lib/types/filters';

interface EnhancedAdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (e: { target: { name: string; value: string | number | string[] } }) => void;
  onApplyFilters: () => void;
  onResetAdvanced: () => void;
}

export const EnhancedAdvancedFilters: React.FC<EnhancedAdvancedFiltersProps> = ({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetAdvanced,
}) => {
  const propertyTypeOptions = [
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'condo', label: 'Condo', icon: '🏢' },
    { value: 'apartment', label: 'Apartment', icon: '🏬' },
    { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
    { value: 'commercial', label: 'Commercial', icon: '🏪' },
    { value: 'land', label: 'Land', icon: '🌱' },
  ];

  const featureOptions = [
    { value: "Pool", icon: "🏊" },
    { value: "Garage", icon: "🚗" },
    { value: "Basement", icon: "🏠" },
    { value: "Fireplace", icon: "🔥" },
    { value: "Balcony", icon: "🌅" },
    { value: "Gym", icon: "💪" },
    { value: "Pet Friendly", icon: "🐕" },
    { value: "Hardwood Floors", icon: "🪵" },
    { value: "Air Conditioning", icon: "❄️" },
    { value: "Heating", icon: "🔥" },
    { value: "Laundry", icon: "👕" },
    { value: "Parking", icon: "🅿️" },
  ];

  const toggleArrayValue = (key: string, value: string, currentArray: string[] = []) => {
    const updated = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    onFilterChange({ target: { name: key, value: updated } });
  };

  // Count active filters
  const activeFiltersCount = [
    filters.propertyType !== 'all',
    (filters.minSquareFeet || 0) > 0,
    (filters.maxSquareFeet || 0) > 0,
    filters.yearBuilt,
    (filters.features?.length || 0) > 0,
    filters.listingDate
  ].filter(Boolean).length;

  return (
    <>
      {/* Enhanced Advanced Filters Button */}
      <Button
        variant="outline"
        onClick={() => onOpenChange(true)}
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
      </Button>

      {/* Enhanced Sheet with better animations */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          className="w-full sm:max-w-lg overflow-y-auto"
          side="right"
        >
          <SheetHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold text-primary">
                Advanced Filters
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription>
              Refine your search with detailed criteria
            </SheetDescription>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </Badge>
              </div>
            )}
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Property Types with Icons */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Property Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {propertyTypeOptions.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`adv-${type.value}`}
                      checked={filters.propertyType === type.value}
                      onCheckedChange={() => 
                        onFilterChange({ 
                          target: { 
                            name: 'propertyType', 
                            value: filters.propertyType === type.value ? 'all' : type.value 
                          } 
                        })
                      }
                    />
                    <label
                      htmlFor={`adv-${type.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Square Footage with Range Display */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Square Footage</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minSqft" className="text-sm text-muted-foreground">
                    Min Sq Ft
                  </Label>
                  <Input
                    id="minSqft"
                    type="number"
                    placeholder="500"
                    value={filters.minSquareFeet || ""}
                    onChange={(e) =>
                      onFilterChange({ 
                        target: { 
                          name: 'minSquareFeet', 
                          value: parseInt(e.target.value) || 0 
                        } 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSqft" className="text-sm text-muted-foreground">
                    Max Sq Ft
                  </Label>
                  <Input
                    id="maxSqft"
                    type="number"
                    placeholder="5000"
                    value={filters.maxSquareFeet || ""}
                    onChange={(e) =>
                      onFilterChange({ 
                        target: { 
                          name: 'maxSquareFeet', 
                          value: parseInt(e.target.value) || 0 
                        } 
                      })
                    }
                  />
                </div>
              </div>
              {((filters.minSquareFeet || 0) > 0 || (filters.maxSquareFeet || 0) > 0) && (
                <div className="text-xs text-muted-foreground">
                  Range: {filters.minSquareFeet || 0} - {filters.maxSquareFeet || '∞'} sq ft
                </div>
              )}
            </div>

            <Separator />

            {/* Year Built */}
            <div className="space-y-3">
              <Label htmlFor="yearBuilt" className="text-base font-semibold">
                Year Built
              </Label>
              <Input
                id="yearBuilt"
                type="text"
                placeholder="e.g., 2020 or 2015-2023"
                value={filters.yearBuilt || ""}
                onChange={(e) => onFilterChange({ target: { name: 'yearBuilt', value: e.target.value } })}
              />
            </div>

            <Separator />

            {/* Features & Amenities with Icons */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Features & Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                {featureOptions.map((feature) => (
                  <div key={feature.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature.value}`}
                      checked={filters.features?.includes(feature.value) || false}
                      onCheckedChange={() => 
                        toggleArrayValue('features', feature.value, filters.features)
                      }
                    />
                    <label
                      htmlFor={`feature-${feature.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <span>{feature.icon}</span>
                      {feature.value}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Listing Date */}
            <div className="space-y-3">
              <Label htmlFor="listingDate" className="text-base font-semibold">
                Listed Date
              </Label>
              <Input
                id="listingDate"
                type="date"
                value={filters.listingDate || ""}
                onChange={(e) => onFilterChange({ target: { name: 'listingDate', value: e.target.value } })}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-3 pt-6 border-t">
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
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EnhancedAdvancedFilters;
