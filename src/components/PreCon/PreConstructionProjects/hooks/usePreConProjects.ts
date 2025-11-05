import { useState, useMemo } from 'react';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { mockPreConProjects } from '../data/mockPreConProjects';
import { convertToPropertyListing } from '../utils/convertToPropertyListing';
import { usePreConFilters } from './usePreConFilters';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

/**
 * Custom hook for managing pre-construction projects
 */
export const usePreConProjects = () => {
  const [allProjects] = useState<PreConstructionProperty[]>(mockPreConProjects);
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();
  
  // Extract unique communities from projects
  const communities = useMemo(() => {
    const uniqueCommunities = new Set<string>();
    allProjects.forEach(project => {
      if (project.address.city) {
        uniqueCommunities.add(project.address.city);
      }
    });
    return Array.from(uniqueCommunities).sort();
  }, [allProjects]);

  // Apply filters
  const filteredProjects = usePreConFilters(allProjects, hiddenProjects, filters);

  // Convert projects to PropertyListing format for map
  const mapProperties = useMemo(() => {
    return filteredProjects.map(convertToPropertyListing);
  }, [filteredProjects]);

  const handleHide = (projectId: string) => {
    setHiddenProjects((prev) => {
      const newSet = new Set(prev);
      newSet.add(projectId);
      return newSet;
    });
  };

  return {
    allProjects,
    filteredProjects,
    mapProperties,
    communities,
    filters,
    handleFilterChange,
    resetFilters,
    handleHide
  };
};

