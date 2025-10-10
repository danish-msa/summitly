"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaBed, FaBath, FaRuler } from 'react-icons/fa';
import { usePropertySearch, PropertySuggestion } from '@/hooks/usePropertySearch';

interface GlobalSearchProps {
  onSuggestionSelect: (property: PropertySuggestion) => void;
  placeholder?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSuggestionSelect, placeholder = "Enter your property address" }) => {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
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
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleAddressInputChange}
          onClick={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-2 rounded-lg"
        >
          <FaSearch />
        </button>
        
        {showSuggestions && searchTerm.length > 1 && (
          <div 
            ref={dropdownRef}
            className="bg-white z-50 w-full shadow absolute text-gray-800 overflow-y-auto max-h-80 rounded-b-lg border border-gray-200 border-t-0 mt-1"
          >
            {loading && <div className="px-4 py-2">Loading...</div>}
            {!loading && suggestions.properties.length > 0 ? (
              <div className="flex flex-wrap">
                <div className="block flex-grow">
                  <div className="flex items-center justify-between bg-gray-100 text-gray-600 px-4 py-2">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="h-4 w-4" />
                      <h5 className="font-bold text-sm pl-2">Properties</h5>
                    </div>
                    <span className="text-xs font-medium text-gray-500">({suggestions.totalCount.toLocaleString()})</span>
                  </div>
                  <ul className="overflow-hidden">
                    {suggestions.properties.map((property) => (
                      <li 
                        key={property.id}
                        onClick={() => handleSuggestionClick(property)}
                        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="font-bold text-gray-800">{property.address}</div>
                        <div className="text-sm text-gray-600">{property.city}, {property.region}</div>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <span className="flex items-center mr-4"><FaBed className="mr-1" /> {property.bedrooms} Beds</span>
                          <span className="flex items-center mr-4"><FaBath className="mr-1" /> {property.bathrooms} Baths</span>
                          <span className="flex items-center"><FaRuler className="mr-1" /> {property.sqft.toLocaleString()} sqft</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              !loading && <div className="px-4 py-2">No properties found.</div>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default GlobalSearch;