"use client";

import React, { useRef, useEffect, useState } from 'react';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface MapSearchBoxProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  onClear: () => void;
  className?: string;
}

const MapSearchBox: React.FC<MapSearchBoxProps> = ({ 
  onPlaceSelect, 
  onClear, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['(cities)', 'address', 'establishment'],
      componentRestrictions: { country: 'ca' }, // Restrict to Canada
    },
    debounce: 300,
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (suggestion: { description: string }) => {
    setValue(suggestion.description, false);
    clearSuggestions();
    setIsOpen(false);
    
    // Get place details
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['name', 'geometry', 'formatted_address', 'place_id']
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect(place);
        }
      }
    );
  };

  const handleClear = () => {
    setValue('');
    clearSuggestions();
    setIsOpen(false);
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      clearSuggestions();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={!ready}
          placeholder="Search for a location..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && status === 'OK' && data.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {data.map((suggestion: { description: string; place_id: string }, index: number) => (
            <div
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start">
                <FaSearch className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-sm text-gray-500">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'ZERO_RESULTS' && value && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">
            <FaSearch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No results found for "{value}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSearchBox;
