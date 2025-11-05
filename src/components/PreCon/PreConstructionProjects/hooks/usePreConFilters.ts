import { useMemo } from 'react';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { FilterState } from '@/lib/types/filters';
import { LOCATIONS } from '@/lib/types/filters';

// Builder slug to developer name mapping
const BUILDER_MAP: Record<string, string> = {
  'premium-developments': 'Premium Developments Inc.',
  'ocean-view': 'Ocean View Developments',
  'metro-builders': 'Metro Builders',
  'alpine-homes': 'Alpine Homes',
};

/**
 * Custom hook for filtering pre-construction projects
 */
export const usePreConFilters = (
  allProjects: PreConstructionProperty[],
  hiddenProjects: Set<string>,
  filters: FilterState
) => {
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // Hide filter
      if (hiddenProjects.has(project.id)) return false;
      
      // Location filter
      if (filters.location && filters.location !== 'all') {
        const location = LOCATIONS.find(loc => loc.id === filters.location);
        if (location) {
          // Check if project city is in the location's areas
          const cityMatch = location.areas?.some(area => 
            area.toLowerCase().includes(project.address.city.toLowerCase()) ||
            project.address.city.toLowerCase().includes(area.toLowerCase())
          );
          // Also check if location name matches city
          const locationNameMatch = location.name.toLowerCase().includes(project.address.city.toLowerCase()) ||
            project.address.city.toLowerCase().includes(location.name.toLowerCase());
          
          if (!cityMatch && !locationNameMatch) {
            return false;
          }
        }
      }
      
      // Property type filter
      if (filters.propertyType && filters.propertyType !== 'all') {
        const propertyTypeLower = project.details.propertyType.toLowerCase();
        if (!propertyTypeLower.includes(filters.propertyType.toLowerCase())) {
          return false;
        }
      }
      
      // Price filter
      if (project.startingPrice < filters.minPrice || project.startingPrice > filters.maxPrice) {
        return false;
      }
      
      // Bedroom range filter (extract min from range like "1-3")
      if (filters.bedrooms && filters.bedrooms > 0) {
        const bedroomRange = project.details.bedroomRange.split('-');
        const minBedrooms = parseInt(bedroomRange[0]);
        if (minBedrooms < filters.bedrooms) {
          return false;
        }
      }
      
      // Builder filter
      if (filters.builder && filters.builder !== 'all') {
        const expectedDeveloper = BUILDER_MAP[filters.builder];
        if (expectedDeveloper && project.developer !== expectedDeveloper) {
          return false;
        }
      }
      
      // Pre-con status filter
      if (filters.preConStatus && filters.preConStatus !== 'all') {
        if (project.status !== filters.preConStatus) {
          return false;
        }
      }
      
      return true;
    });
  }, [allProjects, hiddenProjects, filters]);

  return filteredProjects;
};

