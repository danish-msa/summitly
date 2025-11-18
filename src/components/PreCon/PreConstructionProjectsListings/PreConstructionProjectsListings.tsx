"use client";

import React, { useState, useMemo } from 'react';
import PreConstructionPropertyCardV3 from '../PropertyCards/PreConstructionPropertyCardV3';
import type { PreConstructionProperty } from '../PropertyCards/types';
import { getAllPreConProjects } from '@/data/mockPreConData';
import { PropertyListing } from '@/lib/types';
import { FaSort } from 'react-icons/fa';
import PreConListingFilters from './PreConListingFilters';
import { LOCATIONS } from '@/lib/types/filters';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import dynamic from 'next/dynamic';

// Dynamically import the Google Maps component with no SSR to avoid hydration issues
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

// Convert PropertyListing to PreConstructionProperty format
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
      propertyType: property.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: preCon.completion.progress,
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

// Convert PreConstructionProperty to PropertyListing for map component
const convertToPropertyListing = (project: PreConstructionProperty): PropertyListing => {
  return {
    mlsNumber: project.id,
    status: project.status === 'selling' ? 'A' : project.status === 'sold-out' ? 'S' : 'A',
    class: 'residential',
    type: 'Sale',
    listPrice: project.startingPrice,
    listDate: new Date().toISOString(),
    lastStatus: project.status,
    soldPrice: '',
    soldDate: '',
    address: {
      streetNumber: project.address.street.split(' ')[0] || '',
      streetName: project.address.street.split(' ').slice(1).join(' ') || '',
      city: project.address.city,
      state: project.address.province,
      location: `${project.address.street}, ${project.address.city}, ${project.address.province}`,
      neighborhood: project.address.city,
      area: project.address.city,
      zip: '',
      country: 'Canada',
      district: null,
      majorIntersection: null,
      streetDirection: null,
      streetSuffix: null,
      unitNumber: null,
      streetDirectionPrefix: null,
      addressKey: null,
      communityCode: null
    },
    map: {
      latitude: project.address.latitude || null,
      longitude: project.address.longitude || null,
      point: project.address.latitude && project.address.longitude 
        ? `${project.address.latitude},${project.address.longitude}` 
        : null
    },
    details: {
      propertyType: project.details.propertyType,
      numBedrooms: parseInt(project.details.bedroomRange.split('-')[0]) || 0,
      numBedroomsPlus: 0,
      numBathrooms: parseInt(project.details.bathroomRange.split('-')[0]) || 0,
      numBathroomsPlus: 0,
      sqft: project.details.sqftRange,
      landSize: ''
    },
    images: {
      imageUrl: project.images[0] || '/images/p1.jpg',
      allImages: project.images
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: '',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 0,
      features: '',
      taxLot: ''
    },
    boardId: 0,
    preCon: undefined // This will be handled separately
  } as PropertyListing;
};

const PreConstructionProjectsListings: React.FC = () => {
  // Get all projects from centralized mock data
  const allProjectsData = useMemo(() => {
    const allPropertyListings = getAllPreConProjects();
    return allPropertyListings
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, []);

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
        const price = project.startingPrice;
        return price >= filters.minPrice && price <= filters.maxPrice;
      });
    }

    // Apply bedroom filter
    if (filters.bedrooms > 0) {
      filtered = filtered.filter(project => {
        const [minBeds] = project.details.bedroomRange.split('-').map(Number);
        return minBeds >= filters.bedrooms;
      });
    }

    // Apply bathroom filter
    if (filters.bathrooms > 0) {
      filtered = filtered.filter(project => {
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
        filtered.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.startingPrice - a.startingPrice);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                    : `Pre-Construction Projects (${visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'})`
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
                displayedProjects.map((project) => (
                  <div 
                    key={project.id}
                    className={`transition-all cursor-pointer ${selectedProject?.id === project.id ? 'ring-2 ring-secondary' : ''}`}
                    onClick={() => handleProjectClick(project)}
                  >
                    <PreConstructionPropertyCardV3
                      property={project}
                    />
                  </div>
                ))
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

