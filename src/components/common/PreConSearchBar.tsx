"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PreConSuggestions, { PreConCity, PreConSellingStatus } from '@/components/PreCon/Search/PreConSuggestions';
import SearchResults, { SearchResult } from '@/components/PreCon/Search/SearchResults';

export interface PreConSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onCitySelect?: (city: PreConCity) => void;
  onStatusSelect?: (status: PreConSellingStatus) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showSuggestions?: boolean;
  autoNavigate?: boolean; // If true, automatically navigate on selection
  cities?: PreConCity[];
  sellingStatuses?: PreConSellingStatus[];
}

// Helper function to format status name (e.g., "now-selling" -> "Now Selling")
const formatStatusName = (status: string): string => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PreConSearchBar: React.FC<PreConSearchBarProps> = ({
  value: controlledValue,
  onChange,
  onCitySelect,
  onStatusSelect,
  placeholder = "Enter location to search pre-construction properties",
  className,
  inputClassName,
  showSuggestions = true,
  autoNavigate = true,
  cities: providedCities,
  sellingStatuses: providedSellingStatuses,
}) => {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cities, setCities] = useState<PreConCity[]>([]);
  const [sellingStatuses, setSellingStatuses] = useState<PreConSellingStatus[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use controlled or uncontrolled value
  const searchValue = controlledValue !== undefined ? controlledValue : internalValue;
  const setSearchValue = onChange || setInternalValue;

  // Fetch cities from backend
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch('/api/pre-con-cities');
        if (response.ok) {
          const data = await response.json();
          setCities(data.cities || []);
        } else {
          console.error('Failed to fetch cities');
          setCities([]);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    // Only fetch if cities are not provided via props
    if (!providedCities) {
      fetchCities();
    } else {
      setCities(providedCities);
      setLoadingCities(false);
    }
  }, [providedCities]);

  // Fetch selling statuses from backend
  useEffect(() => {
    const fetchSellingStatuses = async () => {
      try {
        setLoadingStatuses(true);
        // Fetch both filters and projects in parallel
        const [filtersResponse, projectsResponse] = await Promise.all([
          fetch('/api/pre-con-projects/filters'),
          fetch('/api/pre-con-projects?limit=1000') // Get projects to count statuses
        ]);
        
        if (filtersResponse.ok) {
          const filtersData = await filtersResponse.json();
          const statusList = filtersData.sellingStatuses || [];
          
          // Count projects per status if projects data is available
          const statusCounts: Record<string, number> = {};
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            const projects = projectsData.projects || [];
            
            // Type for project from API response
            interface ProjectWithPreCon {
              preCon?: {
                status?: string;
              };
            }
            
            projects.forEach((project: ProjectWithPreCon) => {
              if (project.preCon?.status) {
                const status = project.preCon.status;
                statusCounts[status] = (statusCounts[status] || 0) + 1;
              }
            });
          }
          
          // Map statuses with counts (status is already in slug format from API)
          const statusesWithCounts: PreConSellingStatus[] = statusList.map((status: string) => ({
            id: status.toLowerCase(), // Status is already in slug format
            name: formatStatusName(status),
            numberOfProjects: statusCounts[status] || 0,
          }));
          
          setSellingStatuses(statusesWithCounts);
        } else {
          console.error('Failed to fetch selling statuses');
          setSellingStatuses([]);
        }
      } catch (error) {
        console.error('Error fetching selling statuses:', error);
        setSellingStatuses([]);
      } finally {
        setLoadingStatuses(false);
      }
    };

    // Only fetch if statuses are not provided via props
    if (!providedSellingStatuses) {
      fetchSellingStatuses();
    } else {
      setSellingStatuses(providedSellingStatuses);
      setLoadingStatuses(false);
    }
  }, [providedSellingStatuses]);

  // Use provided cities/statuses or fetched ones
  const displayCities = providedCities || cities;
  const displayStatuses = providedSellingStatuses || sellingStatuses;

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

  const handleStatusSelectInternal = (status: PreConSellingStatus) => {
    setSearchValue(status.name);
    setIsSuggestionsOpen(false);
    
    // Call custom handler if provided
    if (onStatusSelect) {
      onStatusSelect(status);
      return; // Don't auto-navigate if custom handler is provided
    }
    
    // Auto-navigate if enabled and no custom handler
    if (autoNavigate) {
      router.push(`/pre-construction/${status.id}`);
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
              cities={displayCities}
              sellingStatuses={displayStatuses}
              onCitySelect={handleCitySelectInternal}
              onStatusSelect={handleStatusSelectInternal}
              isOpen={isSuggestionsOpen && !loadingCities && !loadingStatuses}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PreConSearchBar;

