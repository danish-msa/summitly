"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaMapMarkerAlt, FaChevronRight } from 'react-icons/fa';
import { IndividualFilterProps, REGIONS, FilterChangeEvent } from '@/lib/types/filters';

const LocationFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(false);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Handle region selection (first level)
  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
  };

  // Handle city selection (second level)
  const handleCitySelect = (regionId: string, city: string) => {
    const event = {
      target: {
        name: 'locationAndArea',
        value: { location: regionId, area: city }
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
    setSelectedRegion(null);
  };

  // Get display text for location
  const getLocationText = () => {
    if (filters.location === 'all') return 'All Locations';
    const region = REGIONS.find(reg => reg.id === filters.location);
    if (region && filters.locationArea && filters.locationArea !== 'all') {
      // Show only the city name when a specific city is selected
      return filters.locationArea;
    }
    return region?.name || 'All Locations';
  };

  // Filter regions based on search
  const filteredRegions = REGIONS.filter((region) => {
    const searchQuery = locationSearchQuery.toLowerCase();
    
    if (region.name.toLowerCase().includes(searchQuery)) {
      return true;
    }
    
    if (region.cities) {
      return region.cities.some(city => 
        city.toLowerCase().includes(searchQuery)
      );
    }
    
    return false;
  });

  // Get cities for selected region, filtered by search
  const getFilteredCities = () => {
    if (!selectedRegion) return [];
    const region = REGIONS.find(reg => reg.id === selectedRegion);
    if (!region) return [];
    
    const searchQuery = locationSearchQuery.toLowerCase();
    if (!searchQuery) return region.cities;
    
    return region.cities.filter(city => 
      city.toLowerCase().includes(searchQuery)
    );
  };

  // Reset selected region when dropdown closes
  useEffect(() => {
    if (!activeDropdown) {
      setSelectedRegion(null);
    }
  }, [activeDropdown]);

  // Handle individual filter reset
  const handleIndividualReset = () => {
    const event = {
      target: {
        name: 'locationAndArea',
        value: { location: 'all', area: 'all' }
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button 
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white transition-all border ${activeDropdown ? 'border-secondary text-primary' : 'border-gray-300 text-primary'} hover:border-secondary`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaMapMarkerAlt className="text-secondary" />
        <span>{getLocationText()}</span>
        {filters.location !== 'all' && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all cursor-pointer"
            title="Clear location filter"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleIndividualReset();
              }
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-[100] mt-2 w-full sm:w-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="h-4 w-4 text-secondary" />
                <h3 className="text-sm font-semibold text-gray-900">Select Location</h3>
              </div>
              {locationSearchQuery && (
                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                  {selectedRegion 
                    ? `${getFilteredCities().length} cit${getFilteredCities().length !== 1 ? 'ies' : 'y'} found`
                    : `${filteredRegions.length} region${filteredRegions.length !== 1 ? 's' : ''} found`}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search city, town, or area..."
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary"
              />
              {locationSearchQuery && (
                <button
                  onClick={() => setLocationSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-5 min-h-[300px]">
            {/* Left Column - Regions */}
            <div className="col-span-2 bg-gray-50 border-r border-gray-200">
              <div className="p-2 space-y-1">
                {filteredRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionSelect(region.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedRegion === region.id
                        ? "bg-secondary text-white shadow-sm"
                        : filters.location === region.id
                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                        : "text-gray-700 hover:bg-gray-200"}
                    `}
                  >
                    <span className="truncate">{region.name}</span>
                    <div className="flex items-center gap-2">
                      {selectedRegion === region.id && (
                        <FaChevronRight className="text-xs" />
                      )}
                      {filters.location === region.id && selectedRegion !== region.id && (
                        <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                          {region.cities.length}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Cities */}
            <div className="col-span-3 bg-white p-3 flex flex-col">
              {selectedRegion ? (
                <>
                  <div className="mb-2 pb-2 border-b border-gray-200 flex-shrink-0">
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-secondary transition-colors"
                    >
                      <FaChevronRight className="rotate-180 text-xs" />
                      <span>Back to Regions</span>
                    </button>
                  </div>
                  {getFilteredCities().length > 0 ? (
                    <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-1">
                      {getFilteredCities().map((city) => {
                        const searchQuery = locationSearchQuery.toLowerCase();
                        const isCityMatch = searchQuery && city.toLowerCase().includes(searchQuery);
                        
                        return (
                          <button
                            key={city}
                            onClick={() => handleCitySelect(selectedRegion, city)}
                            className={`
                              w-full px-3 py-2 rounded-md text-sm text-left transition-all
                              ${filters.location === selectedRegion && filters.locationArea === city
                                ? "bg-secondary/10 text-secondary font-medium border border-secondary/20"
                                : isCityMatch
                                  ? "bg-yellow-50 text-gray-800 hover:bg-yellow-100 border border-yellow-200"
                                  : "text-gray-700 hover:bg-gray-100"}
                            `}
                          >
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                      <FaMapMarkerAlt className="h-8 w-8 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 mb-1">No cities found</p>
                      <p className="text-xs text-gray-400">Try a different search term</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                  <FaMapMarkerAlt className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-1">Select a region</p>
                  <p className="text-xs text-gray-400">Choose a region from the left to see available cities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilter;
