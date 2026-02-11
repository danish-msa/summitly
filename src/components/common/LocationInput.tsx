"use client";

import React, { useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { groupSuggestionsByType, getCoordinates, LocationSuggestionItem } from '@/utils/locationUtils';

export interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCoordinates?: (coordinates: {lat: number, lng: number} | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  value, 
  onChange, 
  onSelectCoordinates,
  placeholder = "Enter location",
  className = "",
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const {
    ready,
    value: inputValue,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
    },
    debounce: 300,
  });
  
  // Sync the external value with the internal input value
  useEffect(() => {
    setValue(value);
  }, [value, setValue]);
  
  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };
  
  const handleSelectSuggestion = async (description: string) => {
    setValue(description, false);
    onChange(description);
    clearSuggestions();
    setIsFocused(false);
    
    // Get coordinates if callback is provided
    if (onSelectCoordinates) {
      const coordinates = await getCoordinates(description);
      onSelectCoordinates(coordinates);
    }
  };
  
  // Group suggestions by types
  const groupedSuggestions = groupSuggestionsByType(data);
  
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInput}
          onFocus={() => setIsFocused(true)}
          disabled={disabled || !ready}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {inputValue && (
          <button 
            onClick={() => {
              setValue('');
              onChange('');
              clearSuggestions();
              if (onSelectCoordinates) onSelectCoordinates(null);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {isFocused && status === "OK" && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
        >
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category} className="px-1 py-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                {category}
              </div>
              <ul>
                {items.map((item: LocationSuggestionItem) => (
                  <li 
                    key={item.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleSelectSuggestion(item.description)}
                  >
                    <FaMapMarkerAlt className="text-primary mr-2" />
                    <div>
                      <div className="font-medium">{item.mainText}</div>
                      <div className="text-xs text-gray-500">{item.secondaryText}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;