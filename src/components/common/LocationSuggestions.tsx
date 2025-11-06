"use client";

import React from 'react';
import { MapPin, Building, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CategorizedLocation {
  id: string;
  description: string;
  type: 'city' | 'neighborhood' | 'address';
  icon: React.ReactNode;
  badgeColor: string;
}

export interface LocationSuggestionsProps {
  suggestions: { place_id: string; description: string }[];
  onSelect: (description: string) => void;
  isOpen: boolean;
  className?: string;
}

const getLocationIcon = (type: CategorizedLocation['type']) => {
  switch (type) {
    case 'city':
      return <Building className="h-4 w-4" />;
    case 'neighborhood':
      return <MapPin className="h-4 w-4" />;
    case 'address':
      return <Home className="h-4 w-4" />;
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
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'city':
      return 'Cities';
    case 'neighborhood':
      return 'Neighborhoods';
    case 'address':
      return 'Addresses';
    default:
      return 'Other';
  }
};

export const categorizeLocation = (description: string): CategorizedLocation['type'] => {
  const lowerDesc = description.toLowerCase();
  
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
  const parts = lowerDesc.split(',').map(part => part.trim());
  
  // Must have exactly 3 parts: City, Province, Country
  if (parts.length === 3 && 
      parts[2] === 'canada' &&
      ['on', 'bc', 'ab', 'mb', 'sk', 'qc', 'ns', 'nb', 'nl', 'pe', 'yt', 'nt', 'nu'].includes(parts[1]) &&
      !lowerDesc.includes('street') && !lowerDesc.includes('avenue') && !lowerDesc.includes('road') &&
      !lowerDesc.includes('drive') && !lowerDesc.includes('lane') && !lowerDesc.includes('boulevard') &&
      !lowerDesc.match(/\d/)) {
    return 'city';
  }
  
  // Default to address for everything else
  return 'address';
};

export const organizeSuggestions = (suggestions: { place_id: string; description: string }[]): Record<string, CategorizedLocation[]> => {
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

  // Define priority order: cities first, then neighborhoods, then addresses
  const priorityOrder = ['city', 'neighborhood', 'address'];
  
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

const LocationSuggestions: React.FC<LocationSuggestionsProps> = ({
  suggestions,
  onSelect,
  isOpen,
  className,
}) => {
  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  // Organize suggestions using the organizeSuggestions function
  const organized = organizeSuggestions(suggestions);

  // Define priority order
  const priorityOrder = ['city', 'neighborhood', 'address'];

  return (
    <div className={cn("absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden max-h-80 overflow-y-auto", className)}>
      <div className="py-2">
        {priorityOrder.map((type) => {
          const locations = organized[type];
          if (!locations || locations.length === 0) return null;

          return (
            <div key={type} className="mb-2">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {getTypeLabel(type)}
                </h4>
              </div>
              {locations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => onSelect(location.description)}
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
                      className={cn("text-xs border", location.badgeColor)}
                    >
                      {location.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LocationSuggestions;

