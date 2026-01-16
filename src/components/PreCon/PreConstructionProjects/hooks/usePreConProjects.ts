import { useState, useMemo, useEffect } from 'react';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { convertApiV1ToPreConProperty, convertToPropertyListing, type ApiV1Project } from '@/components/PreCon/PreConstructionBasePage/utils';
import { usePreConFilters } from './usePreConFilters';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

/**
 * Custom hook for managing pre-construction projects
 */
export const usePreConProjects = () => {
  const [allProjects, setAllProjects] = useState<PreConstructionProperty[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from API using v1
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { api } = await import('@/lib/api/client');
        const response = await api.get<{ projects: ApiV1Project[] }>('/pre-con-projects', {
          params: { limit: 1000 }
        });
        
        if (response.success && response.data) {
          const projects = (response.data.projects || [])
            .map(convertApiV1ToPreConProperty);
          setAllProjects(projects);
          console.log('[usePreConProjects] Loaded projects:', projects.length);
        } else {
          console.warn('[usePreConProjects] API response not successful:', response);
        }
      } catch (error) {
        console.error('Error fetching pre-con projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);
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
    handleHide,
    loading
  };
};

