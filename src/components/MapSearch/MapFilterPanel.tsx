"use client";

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { FilterComponentProps } from '@/lib/types/filters';
import { MapFilterItem } from './filters/MapFilterItem';
import { MapSimilarityFilter } from './filters/MapSimilarityFilter';
import { MapDistanceFilter } from './filters/MapDistanceFilter';
import { MapBedroomFilter } from './filters/MapBedroomFilter';
import { MapBathroomFilter } from './filters/MapBathroomFilter';
import { MapSquareFeetFilter } from './filters/MapSquareFeetFilter';
import { MapSqftAboveGradeFilter } from './filters/MapSqftAboveGradeFilter';
import { MapSqftBelowGradeFilter } from './filters/MapSqftBelowGradeFilter';
import { MapLotSizeFilter } from './filters/MapLotSizeFilter';
import { MapPropertyTypeFilter } from './filters/MapPropertyTypeFilter';
import { MapYearBuiltFilter } from './filters/MapYearBuiltFilter';
import { MapListingStatusFilter } from './filters/MapListingStatusFilter';
import { MapSaleDateFilter } from './filters/MapSaleDateFilter';
import { MapSalePriceFilter } from './filters/MapSalePriceFilter';
import { MapListDateFilter } from './filters/MapListDateFilter';
import { MapListPriceFilter } from './filters/MapListPriceFilter';

interface MapFilterPanelProps extends FilterComponentProps {
  isPreCon?: boolean;
  showPreConStatus?: boolean;
  className?: string;
  // Subject property values for relative filtering
  subjectProperty?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    sqftAboveGrade?: number;
    sqftBelowGrade?: number;
    lotSize?: number;
    propertyType?: string;
    yearBuilt?: number;
    listPrice?: number;
    salePrice?: number;
    listDate?: string;
    saleDate?: string;
    status?: string;
    location?: { lat: number; lng: number };
  };
}

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  filters,
  handleFilterChange,
  resetFilters,
  communities,
  locations,
  isPreCon = false,
  showPreConStatus = false,
  className = '',
  subjectProperty
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const commonProps = {
    filters,
    handleFilterChange,
    resetFilters,
    communities,
    locations
  };

  // When collapsed, show only the header matching the expanded state
  if (isCollapsed) {
    return (
      <div className={`absolute left-4 top-4 z-10 w-80 ${className}`}>
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header - Same style as expanded state */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 text-lg">Filters</h3>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Expand filters"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute left-4 top-4 bottom-4 z-10 w-80 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg">Filters</h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Collapse filters"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Similarity Filter */}
            <MapSimilarityFilter
              {...commonProps}
              similarityScore={undefined}
            />

            {/* Distance Filter */}
            <MapDistanceFilter
              {...commonProps}
              subjectLocation={subjectProperty?.location}
            />

            {/* Bedrooms Filter */}
            <MapBedroomFilter
              {...commonProps}
              subjectBedrooms={subjectProperty?.bedrooms}
            />

            {/* Bathrooms Filter */}
            <MapBathroomFilter
              {...commonProps}
              subjectBathrooms={subjectProperty?.bathrooms}
            />

            {/* Square Feet Filter */}
            <MapSquareFeetFilter
              {...commonProps}
              subjectSquareFeet={subjectProperty?.squareFeet}
            />

            {/* Sq. Ft. Above Grade Filter */}
            <MapSqftAboveGradeFilter
              {...commonProps}
              subjectSqftAbove={subjectProperty?.sqftAboveGrade}
            />

            {/* Sq. Ft. Below Grade Filter */}
            <MapSqftBelowGradeFilter
              {...commonProps}
              subjectSqftBelow={subjectProperty?.sqftBelowGrade}
            />

            {/* Lot Size Filter */}
            <MapLotSizeFilter
              {...commonProps}
              subjectLotSize={subjectProperty?.lotSize}
            />

            {/* Property Type Filter */}
            <MapPropertyTypeFilter
              {...commonProps}
              subjectPropertyType={subjectProperty?.propertyType}
            />

            {/* Year Built Filter */}
            <MapYearBuiltFilter
              {...commonProps}
              subjectYearBuilt={subjectProperty?.yearBuilt}
            />

            {/* Listing Status Filter */}
            <MapListingStatusFilter
              {...commonProps}
              subjectStatus={subjectProperty?.status}
            />

            {/* Sale Date Filter */}
            <MapSaleDateFilter
              {...commonProps}
              subjectSaleDate={subjectProperty?.saleDate}
            />

            {/* Sale Price Filter */}
            <MapSalePriceFilter
              {...commonProps}
              subjectSalePrice={subjectProperty?.salePrice}
            />

            {/* List Date Filter */}
            <MapListDateFilter
              {...commonProps}
              subjectListDate={subjectProperty?.listDate}
            />

            {/* List Price Filter */}
            <MapListPriceFilter
              {...commonProps}
              subjectListPrice={subjectProperty?.listPrice}
            />

          {/* Reset Button */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 rounded-lg bg-white transition-all border border-gray-300 text-primary hover:border-secondary font-medium text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
