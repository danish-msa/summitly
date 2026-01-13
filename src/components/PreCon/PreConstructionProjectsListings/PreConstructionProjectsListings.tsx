"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import PreConstructionPropertyCardV3 from '../PropertyCards/PreConstructionPropertyCardV3';
import type { PreConstructionProperty } from '../PropertyCards/types';
import { PropertyListing } from '@/lib/types';
import { FaSort } from 'react-icons/fa';
import PreConListingFilters from './PreConListingFilters';
import { LOCATIONS } from '@/lib/types/filters';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import dynamic from 'next/dynamic';
import { PreConstructionCardSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the Google Maps component with no SSR to avoid hydration issues
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });


import { convertApiV1ToPreConProperty, convertToPropertyListing, type ApiV1Project } from '@/components/PreCon/PreConstructionBasePage/utils';

const PreConstructionProjectsListings: React.FC = () => {
  const [projects, setProjects] = useState<PreConstructionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const pageSize = 20; // Number of projects per page
  const isLoadingRef = useRef(false);

  // Initial load and load more function
  const fetchProjects = useCallback(async (pageNum: number, append: boolean = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const { api } = await import('@/lib/api/client');
      const response = await api.get<{ 
        projects: ApiV1Project[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>('/pre-con-projects', {
        params: { 
          limit: pageSize,
          page: pageNum
        }
      });
      
      if (response.success && response.data) {
        const convertedProjects = (response.data.projects || [])
          .map(convertApiV1ToPreConProperty);
        
        if (append) {
          setProjects(prev => [...prev, ...convertedProjects]);
        } else {
          setProjects(convertedProjects);
        }

        // Check if there are more projects
        if (response.data.pagination) {
          const { page: currentPage, totalPages, total } = response.data.pagination;
          setTotalProjects(total);
          setHasMore(currentPage < totalPages);
        } else {
          // Fallback: if we got fewer projects than pageSize, no more pages
          setHasMore(convertedProjects.length === pageSize);
        }

        console.log('[PreConstructionProjectsListings] Loaded projects:', convertedProjects.length);
      } else {
        console.warn('[PreConstructionProjectsListings] API response not successful:', response);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching pre-con projects:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [pageSize]);

  // Initial load
  useEffect(() => {
    fetchProjects(1, false);
  }, [fetchProjects]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      // Check if user is near bottom of page (1000px before bottom)
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 &&
        !isLoadingRef.current &&
        !loadingMore &&
        hasMore &&
        !loading
      ) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchProjects(nextPage, true);
          return nextPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, loading, fetchProjects]);

  // Use projects directly (already converted)
  const allProjectsData = useMemo(() => {
    return projects;
  }, [projects]);

  const [communities, setCommunities] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    location: 'all',
    locationArea: 'all',
    minPrice: 0,
    maxPrice: 2000000,
    bedrooms: 0,
    bathrooms: 0,
    propertyType: 'all',
    community: 'all',
    listingType: 'all',
    status: 'all',
    preConStatus: 'all'
  });
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('list');
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  const { getVisibleProperties } = useHiddenProperties();

  // Extract unique communities from projects
  useMemo(() => {
    const uniqueCommunities = Array.from(
      new Set(
        allProjectsData
          .map(project => project.address.city)
          .filter(Boolean) as string[]
      )
    ).sort();
    setCommunities(uniqueCommunities);
  }, [allProjectsData]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...allProjectsData];

    // Apply location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(project => {
        const location = LOCATIONS.find(loc => loc.id === filters.location);
        return location && project.address.city.toLowerCase().includes(location.name.toLowerCase());
      });
    }

    // Apply community filter
    if (filters.community !== 'all') {
      filtered = filtered.filter(project => project.address.city === filters.community);
    }

    // Apply price filter
    if (filters.minPrice > 0 || filters.maxPrice < 2000000) {
      filtered = filtered.filter(project => {
        const price = project.startingPrice || 0;
        return price >= filters.minPrice && price <= filters.maxPrice;
      });
    }

    // Apply bedroom filter
    if (filters.bedrooms > 0) {
      filtered = filtered.filter(project => {
        if (!project.details.bedroomRange) return false;
        const [minBeds] = project.details.bedroomRange.split('-').map(Number);
        return minBeds >= filters.bedrooms;
      });
    }

    // Apply bathroom filter
    if (filters.bathrooms > 0) {
      filtered = filtered.filter(project => {
        if (!project.details.bathroomRange) return false;
        const [minBaths] = project.details.bathroomRange.split('-').map(Number);
        return minBaths >= filters.bathrooms;
      });
    }

    // Apply property type filter
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(project => {
        const propType = project.details.propertyType.toLowerCase();
        const filterType = filters.propertyType.toLowerCase();
        return propType.includes(filterType) || 
               (filterType === 'condo' && propType.includes('condominium'));
      });
    }

    // Apply status filter
    const statusFilter = filters.preConStatus || filters.status;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply sorting
    switch(sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => {
          const priceA = a.startingPrice || 0;
          const priceB = b.startingPrice || 0;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        filtered.sort((a, b) => {
          const priceA = a.startingPrice || 0;
          const priceB = b.startingPrice || 0;
          return priceB - priceA;
        });
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.projectName.localeCompare(b.projectName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.projectName.localeCompare(a.projectName));
        break;
      case 'newest':
      default:
        // Sort by project name as default (can be changed to date if available)
        filtered.sort((a, b) => a.projectName.localeCompare(b.projectName));
        break;
    }

    return filtered;
  }, [allProjectsData, filters, sortOption]);

  // Get visible projects (excluding hidden ones)
  const visibleProjects = useMemo(() => {
    const visiblePropertyIds = getVisibleProperties(
      filteredAndSortedProjects.map(p => ({ mlsNumber: p.id } as PropertyListing))
    ).map(p => p.mlsNumber);
    
    return filteredAndSortedProjects.filter(p => visiblePropertyIds.includes(p.id));
  }, [filteredAndSortedProjects, getVisibleProperties]);

  // Update filters
  const handleFilterChange = (e: { target: { name: string; value: string | number | string[] | { location: string; area: string } } }) => {
    const { name, value } = e.target;
    
    // Handle location and area updates together
    if (name === 'locationAndArea' && typeof value === 'object' && 'location' in value && 'area' in value) {
      setFilters({
        ...filters,
        location: value.location,
        locationArea: value.area
      });
    } else {
      // Handle individual field updates
      setFilters({
        ...filters,
        [name]: ['propertyType', 'community', 'status', 'preConStatus', 'location', 'locationArea'].includes(name) ? value : Number(value)
      });
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      location: 'all',
      locationArea: 'all',
      minPrice: 0,
      maxPrice: 2000000,
      bedrooms: 0,
      bathrooms: 0,
      propertyType: 'all',
      community: 'all',
      listingType: 'all',
      status: 'all',
      preConStatus: 'all'
    });
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  // Handle project click
  const handleProjectClick = (project: PreConstructionProperty) => {
    setSelectedProject(project);
  };

  // Handle map bounds change
   
  const handleMapBoundsChange = (_bounds: {north: number; south: number; east: number; west: number}) => {
    // Map bounds change handler - can be used for filtering properties by bounds in the future
  };

  // Convert visible projects to PropertyListing format for map
  const mapProperties = useMemo(() => {
    return visibleProjects.map(convertToPropertyListing);
  }, [visibleProjects]);

  // Convert selected project to PropertyListing format for map
  const selectedPropertyListing = useMemo(() => {
    return selectedProject ? convertToPropertyListing(selectedProject) : null;
  }, [selectedProject]);

  // Limit projects shown in list when map is enabled (split or map view)
  const displayedProjects = useMemo(() => {
    if (viewMode === 'split' || viewMode === 'map') {
      return visibleProjects.slice(0, 3);
    }
    return visibleProjects;
  }, [visibleProjects, viewMode]);

  if (loading) {
    return (
      <div className="container mx-auto pt-10 pb-24 px-4">
        {/* Filters Skeleton */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <Skeleton className="h-12 w-48 rounded-lg" />
            <Skeleton className="h-12 w-48 rounded-lg" />
            <Skeleton className="h-12 w-48 rounded-lg" />
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>
        </div>

        {/* Results Header Skeleton */}
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center mb-4 mt-8">
          <Skeleton className="h-5 w-48 mb-4 sm:mb-0" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>

        {/* Project Listings Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {[...Array(12)].map((_, index) => (
            <PreConstructionCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-10 pb-24 px-4">
      {/* Filters */}
      <PreConListingFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        resetFilters={resetFilters}
        communities={communities}
        locations={LOCATIONS}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
        {/* Project Listings */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'split' ? 'calc(100vh - 200px)' : 'auto' }}>
            {/* Results Header */}
            <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center mb-4 mt-8">
              <div className="mb-4 sm:mb-0 flex items-center gap-4">
                <span className="text-gray-700 font-medium text-sm">
                  {viewMode === 'split'
                    ? `Showing 3 of ${visibleProjects.length} projects`
                    : `Pre-Construction Projects (${totalProjects > 0 ? `${visibleProjects.length} of ${totalProjects}` : visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'})`
                  }
                </span>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center px-3 py-2 border-r border-gray-200">
                    <FaSort className="mr-2 text-gray-500 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  </div>
                  <select
                    value={sortOption}
                    onChange={handleSortChange}
                    className="px-4 py-2 bg-transparent border-0 text-sm font-medium text-gray-700 focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Project Listings Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${viewMode === 'list' ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-2'} gap-4 mb-10`}>
              {displayedProjects.length > 0 ? (
                <>
                  {displayedProjects.map((project) => (
                    <div 
                      key={project.id}
                      className={`transition-all cursor-pointer ${selectedProject?.id === project.id ? 'ring-2 ring-secondary' : ''}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <PreConstructionPropertyCardV3
                        property={project}
                      />
                    </div>
                  ))}
                  {/* Loading indicator for infinite scroll */}
                  {loadingMore && (
                    <div className="col-span-full flex justify-center py-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                        {[...Array(4)].map((_, index) => (
                          <PreConstructionCardSkeleton key={`loading-${index}`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* End of results message */}
                  {!hasMore && projects.length > 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 text-sm">You've reached the end of the list.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 text-lg">No projects match your current filters.</p>
                  <button 
                    onClick={resetFilters}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} style={{ height: viewMode === 'split' ? 'calc(100vh - 200px)' : '70vh' }}>
            <GooglePropertyMap 
              properties={mapProperties}
              selectedProperty={selectedPropertyListing}
              onPropertySelect={(property) => {
                const project = visibleProjects.find(p => p.id === property.mlsNumber);
                if (project) {
                  handleProjectClick(project);
                }
              }}
              onBoundsChange={handleMapBoundsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreConstructionProjectsListings;

