import { useState, useCallback } from 'react';
import { FilterState, FilterChangeEvent, DEFAULT_FILTER_STATE } from '@/lib/types/filters';

export const useGlobalFilters = (initialFilters?: Partial<FilterState>) => {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialFilters
  });

  const handleFilterChange = useCallback((e: FilterChangeEvent) => {
    const { name, value } = e.target;
    
    setFilters(prev => {
      // Handle location and area updates together
      if (name === 'locationAndArea' && typeof value === 'object' && 'location' in value && 'area' in value) {
        return {
          ...prev,
          location: value.location,
          locationArea: value.area
        };
      }
      
      // Handle individual field updates
      return {
        ...prev,
        [name]: value
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const setFilter = useCallback((name: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  return {
    filters,
    handleFilterChange,
    resetFilters,
    updateFilters,
    setFilter
  };
};
