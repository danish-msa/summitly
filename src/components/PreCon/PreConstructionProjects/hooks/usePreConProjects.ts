import { useState, useMemo, useEffect } from 'react';
import type { PreConstructionProperty } from '../../PropertyCards/types';
import { PropertyListing } from '@/lib/types';
import { convertToPropertyListing } from '../utils/convertToPropertyListing';
import { usePreConFilters } from './usePreConFilters';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

/**
 * Convert PropertyListing to PreConstructionProperty format
 */
const convertToPreConProperty = (property: PropertyListing): PreConstructionProperty | null => {
  if (!property.preCon) return null;

  const preCon = property.preCon;
  const address = property.address;

  return {
    id: property.mlsNumber,
    projectName: preCon.projectName,
    developer: preCon.developer,
    startingPrice: preCon.startingPrice,
    images: property.images?.allImages || [property.images?.imageUrl || '/images/p1.jpg'],
    address: {
      street: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || address.location?.split(',')[0] || '',
      city: address.city || '',
      province: address.state || '',
      latitude: property.map?.latitude ?? undefined,
      longitude: property.map?.longitude ?? undefined,
    },
    details: {
      propertyType: property.details?.propertyType || preCon.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: typeof preCon.completion.progress === 'string' ? 0 : (preCon.completion.progress || 0),
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

/**
 * Custom hook for managing pre-construction projects
 */
export const usePreConProjects = () => {
  const [allProjects, setAllProjects] = useState<PreConstructionProperty[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/pre-con-projects');
        if (response.ok) {
          const data = await response.json();
          const projects = (data.projects || [])
            .map(convertToPreConProperty)
            .filter((project): project is PreConstructionProperty => project !== null);
          setAllProjects(projects);
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

