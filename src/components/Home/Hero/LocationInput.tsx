"use client";

import React, { useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
interface LocationInputProps {
  onSelect: (place: string) => void;
  placeholder: string;
}

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
      componentRestrictions: { country: 'ca' },
      types: ['address']
    },
    debounce: 300,
  });

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
        <div className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="py-2">
            {data.map(({ place_id, description }) => (
              <div
                key={place_id}
                onClick={() => handleSelect(description)}
                className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
              >
                {description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;