"use client";

import React, { useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
interface LocationInputProps {
  onSelect: (place: string) => void;
  placeholder: string;
}

interface CategorizedLocation {
  id: string;
  description: string;
  type: 'city' | 'neighborhood' | 'address' | 'landmark';
  icon: React.ReactNode;
  badgeColor: string;
}

const categorizeLocation = (description: string): CategorizedLocation['type'] => {
  const lowerDesc = description.toLowerCase();
  
  // Check for landmark patterns first (most specific)
  if (lowerDesc.includes('airport') || lowerDesc.includes('mall') || lowerDesc.includes('center') || 
      lowerDesc.includes('plaza') || lowerDesc.includes('station') || lowerDesc.includes('hospital') ||
      lowerDesc.includes('school') || lowerDesc.includes('university') || lowerDesc.includes('park') ||
      lowerDesc.includes('library') || lowerDesc.includes('museum') || lowerDesc.includes('theater') ||
      lowerDesc.includes('zoo') || lowerDesc.includes('outlets') || lowerDesc.includes('islands')) {
    return 'landmark';
  }
  
  // Check for specific address patterns (street numbers + street names)
  if (lowerDesc.match(/\d+\s+(street|avenue|road|drive|lane|boulevard|crescent|place|court|way|circle|trail|st|ave|rd|dr|blvd|cres|pl|ct|cir|trl)/)) {
    return 'address';
  }
  
  // Check for neighborhood patterns
  if (lowerDesc.includes('neighborhood') || lowerDesc.includes('district') || lowerDesc.includes('area') ||
      lowerDesc.includes('community') || lowerDesc.includes('subdivision') || lowerDesc.includes('estates')) {
    return 'neighborhood';
  }
  
  // Check for city patterns - be more restrictive
  // Only consider it a city if it's a simple pattern like "City, Province, Country"
  // and doesn't contain specific street names or landmarks
  const parts = lowerDesc.split(',').map(part => part.trim());
  
  // Must have exactly 3 parts: City, Province, Country
  if (parts.length === 3 && 
      // Last part should be "canada"
      parts[2] === 'canada' &&
      // Second part should be a province code
      ['on', 'bc', 'ab', 'mb', 'sk', 'qc', 'ns', 'nb', 'nl', 'pe', 'yt', 'nt', 'nu'].includes(parts[1]) &&
      // First part should not contain street names or landmarks
      !lowerDesc.includes('street') && !lowerDesc.includes('avenue') && !lowerDesc.includes('road') &&
      !lowerDesc.includes('drive') && !lowerDesc.includes('lane') && !lowerDesc.includes('boulevard') &&
      !lowerDesc.includes('outlets') && !lowerDesc.includes('zoo') && !lowerDesc.includes('airport') &&
      !lowerDesc.includes('islands') && !lowerDesc.includes('premium') && !lowerDesc.includes('meadowvale') &&
      // Should not contain numbers (street numbers)
      !lowerDesc.match(/\d/)) {
    return 'city';
  }
  
  // Default to address for everything else
  return 'address';
};

const getLocationIcon = (type: CategorizedLocation['type']) => {
  switch (type) {
    case 'city':
      return <Building className="h-4 w-4" />;
    case 'neighborhood':
      return <MapPin className="h-4 w-4" />;
    case 'address':
      return <Home className="h-4 w-4" />;
    case 'landmark':
      return <MapPin className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
};

const getBadgeColor = (type: CategorizedLocation['type']) => {
  switch (type) {
    case 'city':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'neighborhood':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'address':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'landmark':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const LocationInput: React.FC<LocationInputProps> = ({ onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'ca' }
    },
    debounce: 300,
  });

  // Debug: Log suggestion patterns
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('Sample suggestions for analysis:', data.slice(0, 5).map(item => ({
        description: item.description,
        place_id: item.place_id,
        categorized_as: categorizeLocation(item.description)
      })));
    }
  }, [data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    setIsOpen(false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(address);
      console.log('Coordinates: ', { lat, lng });
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  // Organize results by category with priority order
  const organizeResults = (suggestions: { place_id: string; description: string }[]) => {
    const categorized = suggestions.map(({ place_id, description }) => {
      const type = categorizeLocation(description);
      return {
        id: place_id,
        description,
        type,
        icon: getLocationIcon(type),
        badgeColor: getBadgeColor(type)
      };
    });

    // Group by type
    const grouped = categorized.reduce((acc, location) => {
      if (!acc[location.type]) {
        acc[location.type] = [];
      }
      acc[location.type].push(location);
      return acc;
    }, {} as Record<string, CategorizedLocation[]>);

    // Define priority order: cities first, then neighborhoods, then addresses, then landmarks
    const priorityOrder = ['city', 'neighborhood', 'address', 'landmark'];
    
    // Create ordered result object
    const orderedResults: Record<string, CategorizedLocation[]> = {};
    
    // Add categories in priority order
    priorityOrder.forEach(type => {
      if (grouped[type] && grouped[type].length > 0) {
        orderedResults[type] = grouped[type];
      }
    });

    return orderedResults;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'city':
        return 'Cities';
      case 'neighborhood':
        return 'Neighborhoods';
      case 'address':
        return 'Addresses';
      case 'landmark':
        return 'Landmarks';
      default:
        return 'Other';
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          className="pl-4 pr-12 h-12 text-base"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
          <Search className="h-10 w-10 p-2 rounded-full text-white btn-gradient-dark cursor-pointer transition-colors" />
        </div>
      </div>
      {isOpen && status === 'OK' && (
        <div className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          <div className="py-2">
            {Object.entries(organizeResults(data)).map(([type, locations]) => (
              <div key={type} className="mb-2">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {getTypeLabel(type)}
                  </h4>
                </div>
                {locations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => handleSelect(location.description)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 text-gray-500">
                          {location.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {location.description}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${location.badgeColor} border`}
                      >
                        {location.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;