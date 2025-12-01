"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PreConSuggestions, { PreConCity, PreConLaunch } from '@/components/PreCon/Search/PreConSuggestions';
import SearchResults, { SearchResult } from '@/components/PreCon/Search/SearchResults';
import { preConCities, preConLaunches } from '@/components/PreCon/Search/preConSearchData';
import { preConCityProjectsData } from '@/components/PreCon/PreConCityProperties/preConCityProjectsData';

export interface PreConSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onCitySelect?: (city: PreConCity) => void;
  onLaunchSelect?: (launch: PreConLaunch) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showSuggestions?: boolean;
  autoNavigate?: boolean; // If true, automatically navigate on selection
  cities?: PreConCity[];
  launches?: PreConLaunch[];
}

const PreConSearchBar: React.FC<PreConSearchBarProps> = ({
  value: controlledValue,
  onChange,
  onCitySelect,
  onLaunchSelect,
  placeholder = "Enter location to search pre-construction properties",
  className,
  inputClassName,
  showSuggestions = true,
  autoNavigate = true,
  cities: providedCities,
  launches: providedLaunches,
}) => {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use controlled or uncontrolled value
  const searchValue = controlledValue !== undefined ? controlledValue : internalValue;
  const setSearchValue = onChange || setInternalValue;

  // Use provided cities/launches or default ones
  const cities = providedCities || preConCities;
  const launches = providedLaunches || preConLaunches;

  // Merge cities with project counts from mock data
  const citiesWithCounts = useMemo(() => {
    return cities.map((city) => {
      const projectData = preConCityProjectsData.find((p) => p.id === city.id);
      return {
        ...city,
        numberOfProjects: projectData?.numberOfProjects,
      };
    });
  }, [cities]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/pre-con-projects/search?q=${encodeURIComponent(query.trim())}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        const allResults = [...(data.projects || []), ...(data.pages || [])];
        setSearchResults(allResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search value is empty, show suggestions instead
    if (!searchValue || searchValue.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchValue);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, performSearch]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    if (isSuggestionsOpen || searchResults.length > 0 || isSearching) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSuggestionsOpen, searchResults.length, isSearching]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (showSuggestions) {
      setIsSuggestionsOpen(true);
    }
    // Clear search results when input is cleared
    if (!newValue || newValue.trim().length < 2) {
      setSearchResults([]);
    }
  };

  const handleInputFocus = () => {
    if (showSuggestions) {
      setIsSuggestionsOpen(true);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setIsSuggestionsOpen(false);
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleCitySelectInternal = (city: PreConCity) => {
    setSearchValue(city.name);
    setIsSuggestionsOpen(false);
    
    // Call custom handler if provided
    if (onCitySelect) {
      onCitySelect(city);
      return; // Don't auto-navigate if custom handler is provided
    }
    
    // Auto-navigate if enabled and no custom handler
    if (autoNavigate) {
      router.push(`/pre-construction/${city.id}`);
    }
  };

  const handleLaunchSelectInternal = (launch: PreConLaunch) => {
    setSearchValue(launch.title);
    setIsSuggestionsOpen(false);
    
    // Call custom handler if provided
    if (onLaunchSelect) {
      onLaunchSelect(launch);
      return; // Don't auto-navigate if custom handler is provided
    }
    
    // Auto-navigate if enabled and no custom handler
    if (autoNavigate) {
      router.push(`/pre-construction/${launch.id}`);
    }
  };

  return (
    <div ref={searchContainerRef} className={cn("relative rounded-full w-full", className)}>
      <div className="relative">
        <Input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn("pl-12 pr-12 h-12 text-base", inputClassName)}
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Clear button */}
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center justify-center pr-4 w-12 h-full rounded-full hover:bg-gray-200 transition-colors"
            title="Clear search"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Results or Suggestions */}
      {showSuggestions && (
        <>
          {/* Show search results when user is typing (2+ characters) */}
          {searchValue && searchValue.trim().length >= 2 ? (
            <SearchResults
              results={searchResults}
              query={searchValue}
              isLoading={isSearching}
              onResultClick={() => {
                setIsSuggestionsOpen(false);
                setSearchResults([]);
              }}
            />
          ) : (
            /* Show static suggestions when input is empty or less than 2 characters */
            <PreConSuggestions
              cities={citiesWithCounts}
              launches={launches}
              onCitySelect={handleCitySelectInternal}
              onLaunchSelect={handleLaunchSelectInternal}
              isOpen={isSuggestionsOpen}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PreConSearchBar;

