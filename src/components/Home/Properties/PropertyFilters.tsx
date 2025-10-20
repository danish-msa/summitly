"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaHome, FaMapMarkerAlt } from 'react-icons/fa';

// Location data structure
interface Location {
  id: string;
  name: string;
  areas?: string[];
}

const LOCATIONS: Location[] = [
  {
    id: "gta",
    name: "Greater Toronto Area",
    areas: ["All of GTA", "Toronto", "Durham", "Halton", "Peel", "York"],
  },
  {
    id: "toronto",
    name: "Toronto",
    areas: ["All of Toronto", "Etobicoke", "North York", "Scarborough", "Toronto & East York"],
  },
  {
    id: "durham",
    name: "Durham",
    areas: ["All of Durham", "Ajax", "Pickering", "Whitby", "Oshawa"],
  },
  {
    id: "halton",
    name: "Halton",
    areas: ["All of Halton", "Burlington", "Oakville", "Milton"],
  },
  {
    id: "peel",
    name: "Peel",
    areas: ["All of Peel", "Brampton", "Mississauga", "Caledon"],
  },
  {
    id: "york",
    name: "York",
    areas: ["All of York", "Markham", "Vaughan", "Richmond Hill", "Aurora"],
  },
  {
    id: "outside-gta",
    name: "Outside GTA",
    areas: ["All Outside GTA", "Hamilton", "Niagara", "Barrie", "Kitchener-Waterloo"],
  },
];

interface FiltersProps {
  filters: {
    propertyType: string;
    community: string;
    location: string;
    locationArea: string;
  };
  handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  resetFilters: () => void;
  communities: string[];
}

const PropertyFilters: React.FC<FiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  resetFilters,
  communities
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  
  // For direct button selection
  const handlePropertyTypeSelect = (value: string) => {
    const event = {
      target: {
        name: 'propertyType',
        value: value
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    handleFilterChange(event);
    setActiveDropdown(null);
  };

  const handleCommunitySelect = (value: string) => {
    const event = {
      target: {
        name: 'community',
        value: value
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    handleFilterChange(event);
    setActiveDropdown(null);
  };

  const handleLocationSelect = (locationId: string, area: string) => {
    // Create a custom event that updates both location and area at once
    const event = {
      target: {
        name: 'locationAndArea',
        value: { location: locationId, area: area }
      }
    } as any;
    handleFilterChange(event);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  // Get display text for property type
  const getPropertyTypeText = () => {
    if (filters.propertyType === 'all') return 'All Types';
    return filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1);
  };

  // Get display text for community
  const getCommunityText = () => {
    if (filters.community === 'all') return 'All Communities';
    return filters.community;
  };

  // Get display text for location
  const getLocationText = () => {
    if (filters.location === 'all') return 'All Locations';
    const location = LOCATIONS.find(loc => loc.id === filters.location);
    console.log('getLocationText - filters:', filters, 'location:', location);
    if (location && filters.locationArea && filters.locationArea !== 'all') {
      return `${location.name} - ${filters.locationArea}`;
    }
    return location?.name || 'All Locations';
  };

  // Filter locations based on search - search through both location names and all areas
  const filteredLocations = LOCATIONS.filter((location) => {
    const searchQuery = locationSearchQuery.toLowerCase();
    
    // Check if location name matches
    if (location.name.toLowerCase().includes(searchQuery)) {
      return true;
    }
    
    // Check if any area within the location matches
    if (location.areas) {
      return location.areas.some(area => 
        area.toLowerCase().includes(searchQuery)
      );
    }
    
    return false;
  });

  const currentLocation = LOCATIONS.find((loc) => loc.id === filters.location);

  // Handle individual filter reset
  const handleIndividualReset = (filterName: string) => {
    if (filterName === 'location') {
      // Special case for location - reset both location and locationArea
      const event = {
        target: {
          name: 'locationAndArea',
          value: { location: 'all', area: 'all' }
        }
      } as any;
      handleFilterChange(event);
    } else {
      const event = {
        target: {
          name: filterName,
          value: 'all'
        }
      } as React.ChangeEvent<HTMLSelectElement>;
      handleFilterChange(event);
    }
  };

  // Use the resetFilters from props
  const handleResetClick = () => {
    resetFilters();
    setActiveDropdown(null);
    setLocationSearchQuery("");
  };

  return (
    <div className="w-full flex flex-col md:flex-row md:flex-wrap items-center gap-4">
      <div className='flex flex-wrap gap-2 w-full md:w-auto justify-center'>
        
        {/* Location Filter */}
        <div className="relative w-full sm:w-auto">
          <button 
            className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'location' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('location')}
          >
            <FaMapMarkerAlt className="text-secondary" />
            <span className="text-sm md:text-base">{getLocationText()}</span>
            {filters.location !== 'all' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualReset('location');
                }}
                className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
                title="Clear location filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'location' && (
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
                          } as any;
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
                  {currentLocation && (
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
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Property Type Filter */}
        <div className="relative w-full sm:w-auto">
          <button 
            className={`w-full sm:w-auto bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'propertyType' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('propertyType')}
          >
            <FaHome className="text-secondary" />
            <span className="text-sm md:text-base">{getPropertyTypeText()}</span>
            {filters.propertyType !== 'all' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualReset('propertyType');
                }}
                className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
                title="Clear property type filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'propertyType' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'propertyType' && (
            <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4">
              <p className="font-semibold mb-3">Property Type</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'All Types' },
                  { value: 'house', label: 'House' },
                  { value: 'condo', label: 'Condo' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'townhouse', label: 'Townhouse' },
                  { value: 'commercial', label: 'Commercial' }
                ].map((option) => {
                  const isSelected = filters.propertyType === option.value;
                  
                  return (
                    <div 
                      key={`type-${option.value}`}
                      className={`
                        border rounded-md py-2 px-3 cursor-pointer text-center
                        transition-all hover:bg-gray-50 text-sm
                        ${isSelected 
                          ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                          : 'border-gray-300 hover:border-secondary text-gray-700'}
                      `}
                      onClick={() => handlePropertyTypeSelect(option.value)}
                    >
                      {option.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Community Filter */}
        <div className="relative w-full sm:w-auto filter-dropdown">
          <button 
            className={`w-full bg-white flex items-center gap-2 px-4 py-2 rounded-md border ${activeDropdown === 'community' ? 'border-secondary bg-secondary/5' : 'border-gray-300'} hover:border-secondary transition-all`}
            onClick={() => toggleDropdown('community')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm md:text-base">{getCommunityText()}</span>
            {filters.community !== 'all' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualReset('community');
                }}
                className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all"
                title="Clear community filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <FaChevronDown className={`ml-1 transition-transform ${activeDropdown === 'community' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'community' && (
            <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
              <p className="font-semibold mb-3">Community</p>
              <div className="space-y-2">
                <div 
                  className={`
                    border rounded-md py-2 px-3 cursor-pointer text-center
                    transition-all hover:bg-gray-50 text-sm
                    ${filters.community === 'all' 
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                      : 'border-gray-300 hover:border-secondary text-gray-700'}
                  `}
                  onClick={() => {
                    const event = {
                      target: {
                        name: 'community',
                        value: 'all'
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFilterChange(event);
                    setActiveDropdown(null);
                  }}
                >
                  All Communities
                </div>
                
                {communities.map((community) => (
                  <div 
                    key={`community-${community}`}
                    className={`
                      border rounded-md py-2 px-3 cursor-pointer text-center
                      transition-all hover:bg-gray-50 text-sm
                      ${filters.community === community 
                        ? 'border-2 border-secondary bg-secondary/5 text-secondary font-semibold' 
                        : 'border-gray-300 hover:border-secondary text-gray-700'}
                    `}
                    onClick={() => handleCommunitySelect(community)}
                  >
                    {community}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        

      </div>
    </div>
  );
};

export default PropertyFilters;
