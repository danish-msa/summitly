"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaBed, FaBath, FaRuler } from 'react-icons/fa';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePropertySearch, PropertySuggestion } from '@/hooks/usePropertySearch';

interface GlobalPropertySearchProps {
  onSuggestionSelect: (property: PropertySuggestion) => void;
  placeholder?: string;
}

const GlobalPropertySearch: React.FC<GlobalPropertySearchProps> = ({ onSuggestionSelect, placeholder = "Enter your property address" }) => {
  const { searchTerm, setSearchTerm, suggestions, loading } = usePropertySearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (property: PropertySuggestion) => {
    setSearchTerm(`${property.address}, ${property.city}, ${property.region}`);
    setShowSuggestions(false);
    onSuggestionSelect(property);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.properties.length > 0) {
      handleSuggestionClick(suggestions.properties[0]);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 1) {
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative w-full" ref={dropdownRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleAddressInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pl-12 pr-12 h-12 text-base bg-white"
          />
          {/* MapPin icon on left */}
          <div className="absolute inset-y-0 left-0 h-8 top-1/2 transform -translate-y-1/2 flex items-center p-2 ml-2">
            <MapPin className="h-4 w-4 text-gray-500" />
          </div>
          {/* Clear and Search buttons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-1 space-x-1">
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <button
              type="submit"
              className="h-10 w-10 p-2 rounded-full text-white btn-gradient-dark cursor-pointer transition-colors flex items-center justify-center"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {showSuggestions && searchTerm.length > 1 && (
          <div className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            {loading && <div className="px-4 py-2">Loading...</div>}
            {!loading && suggestions.properties.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Properties
                      </h4>
                    </div>
                    <span className="text-xs font-medium text-gray-500">({suggestions.totalCount.toLocaleString()})</span>
                  </div>
                </div>
                {suggestions.properties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => handleSuggestionClick(property)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {property.address}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {property.city}, {property.region}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                          <span className="flex items-center"><FaBed className="mr-1" /> {property.bedrooms} Beds</span>
                          <span className="flex items-center"><FaBath className="mr-1" /> {property.bathrooms} Baths</span>
                          <span className="flex items-center"><FaRuler className="mr-1" /> {property.sqft.toLocaleString()} sqft</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && <div className="px-4 py-2 text-gray-500">No properties found.</div>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default GlobalPropertySearch;

