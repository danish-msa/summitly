"use client";

import React from 'react';
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetOverlay,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FilterState } from '@/lib/types/filters';

interface AdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (e: { target: { name: string; value: any } }) => void;
  onApplyFilters: () => void;
  onResetAdvanced: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetAdvanced,
}) => {
  const propertyTypeOptions = [
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' },
  ];

  const featureOptions = [
    "Pool",
    "Garage",
    "Basement",
    "Fireplace",
    "Balcony",
    "Gym",
    "Pet Friendly",
    "Hardwood Floors",
    "Air Conditioning",
    "Heating",
    "Laundry",
    "Parking",
  ];

  const listingTypeOptions = [
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
    { value: 'sold', label: 'Sold' },
    { value: 'pending', label: 'Pending' },
  ];

  const toggleArrayValue = (key: string, value: string, currentArray: string[] = []) => {
    const updated = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    onFilterChange({ target: { name: key, value: updated } });
  };

  return (
    <>
      {/* Advanced Filters Button */}
      <Button
        variant="outline"
        onClick={() => onOpenChange(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-secondary hover:bg-gray-50 transition-all"
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm">Advanced</span>
      </Button>

      {/* Advanced Filters Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetOverlay className="z-[10000] bg-white/10" style={{ zIndex: 10000 }} />
        <SheetContent 
          className="w-full sm:max-w-lg overflow-y-auto z-[10001]"
          style={{ zIndex: 10001 }}
        >
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-primary">
              Advanced Filters
            </SheetTitle>
            <SheetDescription>
              Refine your search with detailed criteria
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Property Types */}
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Square Footage */}
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

            {/* Listing Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Listing Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {listingTypeOptions.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`listing-${type.value}`}
                      checked={filters.listingType === type.value}
                      onCheckedChange={() => 
                        onFilterChange({ 
                          target: { 
                            name: 'listingType', 
                            value: filters.listingType === type.value ? 'all' : type.value 
                          } 
                        })
                      }
                    />
                    <label
                      htmlFor={`listing-${type.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Features & Amenities */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Features & Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                {featureOptions.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={filters.features?.includes(feature) || false}
                      onCheckedChange={() => 
                        toggleArrayValue('features', feature, filters.features)
                      }
                    />
                    <label
                      htmlFor={`feature-${feature}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {feature}
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

export default AdvancedFilters;
