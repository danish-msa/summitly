"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { LayoutGrid, MapPin, Bell, TrendingUp, Home } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import { PreConstructionPropertyCardV3 } from '@/components/PreCon/PropertyCards';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';
import { PropertyListing } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

// Helper function to convert slug back to city name
const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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

// Convert PreConstructionProperty to PropertyListing for map
const convertToPropertyListing = (project: PreConstructionProperty): PropertyListing => {
  const streetParts = project.address.street.split(' ');
  return {
    mlsNumber: project.id,
    status: project.status === 'selling' ? 'A' : 'U',
    class: 'residential',
    type: 'Sale',
    listPrice: project.startingPrice,
    listDate: new Date().toISOString(),
    lastStatus: project.status === 'selling' ? 'A' : 'U',
    soldPrice: '',
    soldDate: '',
    updatedOn: new Date().toISOString(),
    boardId: 0,
    address: {
      area: null,
      city: project.address.city || null,
      country: 'Canada',
      district: null,
      majorIntersection: null,
      neighborhood: null,
      streetDirection: null,
      streetName: streetParts.length > 1 ? streetParts.slice(1).join(' ') : null,
      streetNumber: streetParts[0] || null,
      streetSuffix: null,
      unitNumber: null,
      zip: null,
      state: project.address.province || null,
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: `${project.address.street}, ${project.address.city}, ${project.address.province}`,
    },
    map: {
      latitude: project.address.latitude || null,
      longitude: project.address.longitude || null,
      point: null,
    },
    images: {
      allImages: project.images,
      imageUrl: project.images[0],
    },
    details: {
      propertyType: project.details.propertyType || '',
      numBathrooms: parseInt(project.details.bathroomRange.split('-')[0]) || 1,
      numBathroomsPlus: parseInt(project.details.bathroomRange.split('-')[1]) || 1,
      numBedrooms: parseInt(project.details.bedroomRange.split('-')[0]) || 1,
      numBedroomsPlus: parseInt(project.details.bedroomRange.split('-')[1]) || 1,
      sqft: project.details.sqftRange || '',
    },
    lot: {
      acres: 0,
      depth: '',
      irregular: '',
      legalDescription: '',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 0,
      features: '',
      taxLot: '',
    },
    preCon: {
      projectName: project.projectName,
      developer: project.developer,
      startingPrice: project.startingPrice,
      status: project.status,
      details: project.details,
      completion: project.completion,
      features: project.features,
      depositStructure: project.depositStructure,
      description: '',
    },
  };
};

interface PreConstructionCityPageProps {
  citySlug: string;
}

const PreConstructionCityPage: React.FC<PreConstructionCityPageProps> = ({ citySlug }) => {
  const [projects, setProjects] = useState<PropertyListing[]>([]);
  const [allProjects, setAllProjects] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState<{ name: string; numberOfProjects: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'mixed' | 'map'>('list');
  const [selectedProject, setSelectedProject] = useState<PreConstructionProperty | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  
  // Use global filters hook
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();

  // Convert slug to city name
  const cityName = useMemo(() => {
    return unslugifyCityName(citySlug);
  }, [citySlug]);

  // Fetch pre-construction projects for the city
  useEffect(() => {
    const loadCityData = async () => {
      try {
        setLoading(true);

        // Fetch projects for the city
        const response = await fetch(`/api/pre-con-projects?city=${encodeURIComponent(cityName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        const cityProjects = data.projects || [];

        // Set city info
        setCityInfo({
          name: cityName,
          numberOfProjects: cityProjects.length,
        });

        setProjects(cityProjects);
        setAllProjects(cityProjects);
        
        // Extract unique communities from the projects
        const uniqueCommunities = Array.from(
          new Set(
            cityProjects
              .map((project: PropertyListing) => project.address?.neighborhood || project.address?.city)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('Error loading city data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug) {
      loadCityData();
    }
  }, [citySlug, cityName]);

  // Filter projects based on filter state
  useEffect(() => {
    if (allProjects.length === 0) return;

    let filtered = [...allProjects];

    // Filter by property type
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(project => 
        project.details?.propertyType?.toLowerCase() === filters.propertyType.toLowerCase() ||
        project.preCon?.details?.propertyType?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    // Filter by price
    if (filters.minPrice > 0) {
      filtered = filtered.filter(project => 
        (project.preCon?.startingPrice || project.listPrice || 0) >= filters.minPrice
      );
    }
    if (filters.maxPrice < 2000000) {
      filtered = filtered.filter(project => 
        (project.preCon?.startingPrice || project.listPrice || 0) <= filters.maxPrice
      );
    }

    // Filter by location area (if selected)
    if (filters.locationArea !== 'all') {
      filtered = filtered.filter(project => 
        project.address?.neighborhood?.toLowerCase().includes(filters.locationArea.toLowerCase()) ||
        project.address?.area?.toLowerCase().includes(filters.locationArea.toLowerCase()) ||
        project.address?.city?.toLowerCase().includes(filters.locationArea.toLowerCase())
      );
    }

    setProjects(filtered);
  }, [filters, allProjects]);

  // Convert projects to PreConstructionProperty format
  const preConProjects = useMemo(() => {
    return projects
      .map(convertToPreConProperty)
      .filter((project): project is PreConstructionProperty => project !== null);
  }, [projects]);

  // Convert projects to PropertyListing format for map
  const mapProperties = useMemo(() => {
    return preConProjects.map(convertToPropertyListing);
  }, [preConProjects]);

  // Find selected property for map
  const selectedPropertyForMap = useMemo(() => {
    if (!selectedProject) return null;
    return mapProperties.find(p => p.mlsNumber === selectedProject.id) || null;
  }, [selectedProject, mapProperties]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600">Loading pre-construction projects...</p>
        </div>
      </div>
    );
  }

  const displayCityName = cityInfo?.name || cityName;

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <header className="border-b bg-card pt-16">
        <div className="container-1400 mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {displayCityName} Pre-Construction Projects
              </h1>
              <p className="text-muted-foreground">
                Discover the latest pre-construction opportunities in {displayCityName}. 
                Explore upcoming developments, pricing, and availability.
              </p>
            </div>
            <button 
              onClick={() => {
                toast({
                  title: "Alerts Coming Soon",
                  description: "Property alerts for pre-construction projects will be available soon.",
                  variant: "default",
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Get Alerts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-1400 mx-auto px-4 py-8 space-y-4">
        
        {/* Navigation Buttons */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${citySlug}/trends`}
              className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Market Trends
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore housing market statistics and price trends for {displayCityName}
                </p>
              </div>
            </Link>

            <Link
              href={`/${citySlug}/neighbourhoods`}
              className="group flex items-center gap-4 p-6 border bg-white rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Neighbourhoods
                </h3>
                <p className="text-sm text-muted-foreground">
                  Discover different neighbourhoods and areas in {displayCityName}
                </p>
              </div>
            </Link>
          </div>
        </section>
        <Separator />

        {/* Filters */}
        <section>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <GlobalFilters
                filters={filters}
                handleFilterChange={handleFilterChange}
                resetFilters={resetFilters}
                communities={communities}
                locations={LOCATIONS}
                showLocation={false}
                showPropertyType={true}
                showCommunity={false}
                showPrice={true}
                showBedrooms={false}
                showBathrooms={false}
                showAdvanced={true}
                showSellRentToggle={false}
                layout="horizontal"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Project Listings */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2">
                Projects {preConProjects.length}
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Sort by Date (Newest)
              </div>
              <div className="flex">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-l-lg ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="List View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-xs font-medium">List</span>
                </button>
                <button
                  onClick={() => setViewMode('mixed')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all ${
                    viewMode === 'mixed'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="Mixed View"
                >
                  <div className="flex gap-0.5 items-center">
                    <LayoutGrid className="w-3 h-3" />
                    <MapPin className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium">Mixed</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-r-lg ${
                    viewMode === 'map'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-brand-tide'
                  }`}
                  title="Map View"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* View Content */}
          <div className={`flex ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6`}>
            {/* Project Listings */}
            {(viewMode === 'list' || viewMode === 'mixed') && (
              <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`} style={{ maxHeight: viewMode === 'mixed' ? 'calc(100vh - 200px)' : 'auto' }}>
                {preConProjects.length > 0 ? (
                  <div className={`grid gap-6 ${
                    viewMode === 'mixed' 
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {preConProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`cursor-pointer transition-all ${
                          selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <PreConstructionPropertyCardV3
                          property={project}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-secondary/30 rounded-lg p-12 text-center">
                    <p className="text-lg text-muted-foreground">
                      No pre-construction projects found in {displayCityName}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'mixed') && (
              <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden`} style={{ height: viewMode === 'mixed' ? 'calc(100vh - 200px)' : '70vh' }}>
                <GooglePropertyMap
                  properties={mapProperties}
                  selectedProperty={selectedPropertyForMap}
                  onPropertySelect={(property) => {
                    if (property) {
                      const project = preConProjects.find(p => p.id === property.mlsNumber);
                      if (project) {
                        setSelectedProject(project);
                      }
                    }
                  }}
                  onBoundsChange={() => {}}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PreConstructionCityPage;

