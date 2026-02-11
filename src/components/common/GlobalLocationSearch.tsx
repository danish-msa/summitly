"use client";

import React, { useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';
import LocationSuggestions from './LocationSuggestions';

export interface GlobalLocationSearchProps {
  onSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  showLocationButton?: boolean;
  showSearchButton?: boolean;
  countryRestriction?: string | string[];
  animatedPlaceholder?: boolean;
  inputClassName?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const GlobalLocationSearch: React.FC<GlobalLocationSearchProps> = ({
  onSelect,
  placeholder = "Enter location",
  className,
  showLocationButton = true,
  showSearchButton = true,
  countryRestriction = 'ca',
  animatedPlaceholder = false,
  inputClassName,
  disabled = false,
  value: controlledValue,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { location, detectLocation, isLoading: locationLoading } = useLocationDetection();

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: countryRestriction 
        ? { country: Array.isArray(countryRestriction) ? countryRestriction : [countryRestriction] }
        : undefined
    },
    debounce: 300,
  });

  // Use controlled value if provided, otherwise use internal value
  const inputValue = controlledValue !== undefined ? controlledValue : value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setValue(newValue);
    setIsOpen(true);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    setIsOpen(false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(address, { lat, lng });
    } catch (error) {
      console.error('Error getting coordinates: ', error);
      onSelect(address);
    }
  };

  // Handle location detection
  const handleLocationDetection = () => {
    if (location) {
      onSelect(location.fullLocation);
    } else {
      detectLocation();
    }
  };

  // Handle clearing the input
  const handleClear = () => {
    setValue('', false);
    clearSuggestions();
    setIsOpen(false);
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <SearchBar
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClear={handleClear}
        placeholder={placeholder}
        className={className}
        inputClassName={inputClassName}
        disabled={!ready || disabled}
        showLocationButton={showLocationButton}
        showSearchButton={showSearchButton}
        animatedPlaceholder={animatedPlaceholder}
        locationButtonProps={{
          onClick: handleLocationDetection,
          isLoading: locationLoading,
          title: location ? `Use my location: ${location.fullLocation}` : "Detect my location"
        }}
      />
      
      <LocationSuggestions
        suggestions={status === 'OK' && data.length > 0 ? data : []}
        onSelect={handleSelect}
        isOpen={isOpen && status === 'OK' && data.length > 0}
      />
      
      {isOpen && status === 'OK' && data.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-2 text-gray-500 text-sm">No locations found.</div>
        </div>
      )}
    </div>
  );
};

export default GlobalLocationSearch;

