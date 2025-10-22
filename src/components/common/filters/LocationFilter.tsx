"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaMapMarkerAlt } from 'react-icons/fa';
import { Navigation } from 'lucide-react';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { IndividualFilterProps, LOCATIONS } from '@/lib/types/filters';

const LocationFilter: React.FC<IndividualFilterProps> = ({ 
  filters, 
  handleFilterChange,
  locations = LOCATIONS
}) => {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const { location, detectLocation, isLoading: locationLoading } = useLocationDetection();

  // Handle location selection
  const handleLocationSelect = (locationId: string, area: string) => {
    const event = {
      target: {
        name: 'locationAndArea',
        value: { location: locationId, area: area }
      }
    } as FilterChangeEvent;
    handleFilterChange(event);
    setActiveDropdown(false);
  };

  // Handle location detection
  const handleUseMyLocation = () => {
    if (location) {
      const matchedLocation = matchLocationWithFilters(location);
      if (matchedLocation) {
        const event = {
          target: {
            name: 'locationAndArea',
            value: { location: matchedLocation.location, area: matchedLocation.area }
          }
        } as FilterChangeEvent;
        handleFilterChange(event);
        setActiveDropdown(false);
      }
    } else {
      detectLocation();
    }
  };

  // Function to match detected location with available locations
  const matchLocationWithFilters = (detectedLocation: { city: string; area: string; fullLocation: string }) => {
    for (const loc of locations) {
      if (detectedLocation.city.toLowerCase().includes(loc.name.toLowerCase()) || 
          loc.name.toLowerCase().includes(detectedLocation.city.toLowerCase())) {
        return { location: loc.id, area: loc.areas?.[0] || 'all' };
      }
      
      if (loc.areas) {
        for (const area of loc.areas) {
          if (detectedLocation.area.toLowerCase().includes(area.toLowerCase()) ||
              area.toLowerCase().includes(detectedLocation.area.toLowerCase())) {
            return { location: loc.id, area };
          }
        }
      }
    }
    return null;
  };

  // Get display text for location
  const getLocationText = () => {
    if (filters.location === 'all') return 'All Locations';
    const location = locations.find(loc => loc.id === filters.location);
    if (location && filters.locationArea && filters.locationArea !== 'all') {
      return `${location.name} - ${filters.locationArea}`;
    }
    return location?.name || 'All Locations';
  };

  // Filter locations based on search
  const filteredLocations = locations.filter((location) => {
    const searchQuery = locationSearchQuery.toLowerCase();
    
    if (location.name.toLowerCase().includes(searchQuery)) {
      return true;
    }
    
    if (location.areas) {
      return location.areas.some(area => 
        area.toLowerCase().includes(searchQuery)
      );
    }
    
    return false;
  });

  const currentLocation = locations.find((loc) => loc.id === filters.location);

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
    <div className="relative w-full sm:w-auto">
      <button 
        className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-full border ${activeDropdown ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
        onClick={() => setActiveDropdown(!activeDropdown)}
      >
        <FaMapMarkerAlt className="text-secondary" />
        <span className="font-base text-sm md:text-sm">{getLocationText()}</span>
        {filters.location !== 'all' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIndividualReset();
            }}
            className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
            title="Clear location filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <FaChevronDown className={`ml-1 transition-transform ${activeDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown && (
        <div className="absolute z-10 mt-2 w-full sm:w-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="h-4 w-4 text-secondary" />
                <h3 className="text-sm font-semibold text-gray-900">Select Location</h3>
              </div>
              {locationSearchQuery && (
                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                  {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
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

          {/* Use My Location Button */}
          <div className="px-4 py-2 border-b border-gray-200">
            <button
              onClick={handleUseMyLocation}
              disabled={locationLoading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary bg-secondary/10 hover:bg-secondary/20 rounded-md transition-colors disabled:opacity-50"
            >
              {locationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
                  <span>Detecting location...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>{location ? `Use my location: ${location.fullLocation}` : "Use my location"}</span>
                </>
              )}
            </button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-5 min-h-[300px]">
            {/* Left Column - Regions */}
            <div className="col-span-2 bg-gray-50">
              <div className="p-2 space-y-1">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => {
                      const event = {
                        target: {
                          name: 'locationAndArea',
                          value: { 
                            location: location.id, 
                            area: location.areas?.[0] || 'all' 
                          }
                        }
                      } as FilterChangeEvent;
                      handleFilterChange(event);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${filters.location === location.id
                        ? "bg-secondary text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-200"}
                    `}
                  >
                    <span className="truncate">{location.name}</span>
                    {filters.location === location.id && (
                      <span className="ml-2 text-xs bg-white/20 px-1 rounded">
                        {location.areas?.length || 0}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Areas */}
            <div className="col-span-3 bg-white p-3">
              {currentLocation ? (
                <div className="space-y-1">
                  {currentLocation.areas?.map((area, idx) => {
                    const searchQuery = locationSearchQuery.toLowerCase();
                    const isAreaMatch = searchQuery && area.toLowerCase().includes(searchQuery);
                    
                    return (
                      <button
                        key={area}
                        onClick={() => handleLocationSelect(currentLocation.id, area)}
                        className={`
                          w-full px-3 py-2 rounded-md text-sm text-left transition-all
                          ${filters.locationArea === area
                            ? "bg-secondary/10 text-secondary font-medium border border-secondary/20"
                            : isAreaMatch
                              ? "bg-yellow-50 text-gray-800 hover:bg-yellow-100 border border-yellow-200"
                              : "text-gray-700 hover:bg-gray-100"}
                          ${idx === 0 && "font-semibold"}
                        `}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <FaMapMarkerAlt className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-1">Select a location</p>
                  <p className="text-xs text-gray-400">Choose a region to see available areas</p>
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
