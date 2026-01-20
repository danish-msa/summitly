"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getListings } from '@/lib/api/properties';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/lib/types';
import { LOCATIONS, REGIONS, FilterState } from '@/lib/types/filters';
import SellRentToggle from '@/components/common/filters/SellRentToggle';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import GlobalFilters from '../common/filters/GlobalFilters';
import { PropertyCardSkeleton } from '@/components/skeletons';
import { ViewModeToggle, type ViewMode } from '@/components/common/ViewModeToggle';
import dynamic from 'next/dynamic';
import { filterPropertiesByState } from '@/lib/utils/filterProperties';

// Dynamically import the Google Maps component with no SSR
const GooglePropertyMap = dynamic(() => import('@/components/MapSearch/GooglePropertyMap'), { ssr: false });

// Default center (Toronto area) - fallback if geolocation fails
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<FilterState>({
    location: 'all',
    locationArea: 'all',
    minPrice: 0,
    maxPrice: 1000000,
    bedrooms: 0,
    bathrooms: 0,
    propertyType: 'all',
    community: 'all',
    listingType: 'all',
    minSquareFeet: 0,
    maxSquareFeet: 0,
    yearBuilt: 'all'
  });
  const [mapBounds, setMapBounds] = useState<{north: number; south: number; east: number; west: number} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use hidden properties hook
  const { hideProperty, getVisibleProperties } = useHiddenProperties();

  // Apply filters to properties
  const filteredProperties = filterPropertiesByState(properties, filters);

  // Get visible properties (filtered properties minus hidden ones)
  const visibleProperties = getVisibleProperties(filteredProperties);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Use default location if geolocation fails
          setUserLocation(defaultCenter);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Fallback to default location
      setUserLocation(defaultCenter);
    }
  }, []);

  // Load properties based on map bounds and filters
  const loadPropertiesByBounds = useCallback(async (bounds: {north: number; south: number; east: number; west: number}) => {
    setLoading(true);
    
    try {
      // Build API parameters based on filters
      const params: Record<string, string | number> = {
        status: "A", // Active listings
        resultsPerPage: 500 // Get more results for map view
      };
      
      // Only add filters if they have values
      if (filters.minPrice > 0) params.minPrice = filters.minPrice;
      if (filters.maxPrice < 1000000) params.maxPrice = filters.maxPrice;
      if (filters.bedrooms > 0) params.minBedrooms = filters.bedrooms;
      if (filters.bathrooms > 0) params.minBaths = filters.bathrooms;
      if (filters.propertyType !== 'all') params.propertyType = filters.propertyType;
      if (filters.community !== 'all') params.community = filters.community;
      
      // Add listing type filter (Sale or Lease)
      if (listingType === 'sell') {
        params.type = 'Sale';
      } else if (listingType === 'rent') {
        params.type = 'Lease';
      }
      
      // Add location filter if specified
      if (filters.location !== 'all') {
        if (filters.locationArea && filters.locationArea !== 'all') {
          params.city = filters.locationArea;
        } else {
          const selectedRegion = REGIONS.find(reg => reg.id === filters.location);
          if (selectedRegion) {
            params.city = selectedRegion.name;
          }
        }
      }
      
      // Call the API
      const data = await getListings(params);
      
      if (data && data.listings) {
        // Filter by listing type
        let filteredListings = data.listings.filter(listing => 
          listingType === 'rent' ? listing.type === 'Lease' : listing.type === 'Sale'
        );
        
        // Filter by map bounds (client-side filtering)
        filteredListings = filteredListings.filter(listing => {
          if (!listing.map.latitude || !listing.map.longitude) return false;
          const lat = listing.map.latitude;
          const lng = listing.map.longitude;
          return lat >= bounds.south && lat <= bounds.north && 
                 lng >= bounds.west && lng <= bounds.east;
        });
        
        setProperties(filteredListings);
        
        // Extract unique communities from the data
        const uniqueCommunities = Array.from(
          new Set(
            data.listings
              .map(listing => listing.address.neighborhood)
              .filter(Boolean) as string[]
          )
        ).sort();
        setCommunities(uniqueCommunities);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [filters, listingType]);

  // Handle map bounds change (debounced)
  const handleBoundsChange = useCallback((bounds: {north: number; south: number; east: number; west: number}) => {
    setMapBounds(bounds);
    
    // Debounce the API call to avoid too many requests
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }
    
    boundsChangeTimeoutRef.current = setTimeout(() => {
      loadPropertiesByBounds(bounds);
    }, 500); // 500ms debounce
  }, [loadPropertiesByBounds]);

  // Initial load when user location is available
  useEffect(() => {
    if (userLocation && isInitialLoad && mapBounds) {
      loadPropertiesByBounds(mapBounds);
    }
  }, [userLocation, isInitialLoad, mapBounds, loadPropertiesByBounds]);

  // Reload when filters change
  useEffect(() => {
    if (mapBounds && !isInitialLoad) {
      loadPropertiesByBounds(mapBounds);
    }
  }, [filters, listingType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
    };
  }, []);

  // Handle property card click
  const handlePropertyClick = (property: PropertyListing | null) => {
    setSelectedProperty(property);
  };

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
      // String fields that should remain strings
      const stringFields = ['propertyType', 'community', 'listingType', 'location', 'locationArea', 'features', 'yearBuilt', 'preConStatus', 'constructionStatus', 'occupancyDate', 'developer', 'subPropertyType', 'ownershipType', 'garage', 'basement', 'locker', 'balcony'];
      
      // Number fields that should be converted to numbers
      const numberFields = ['minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'minSquareFeet', 'maxSquareFeet', 'availableUnits', 'suites', 'storeys'];
      
      setFilters({
        ...filters,
        [name]: stringFields.includes(name) 
          ? value 
          : numberFields.includes(name)
          ? Number(value) || 0
          : value
      });
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      location: 'all',
      locationArea: 'all',
      minPrice: 0,
      maxPrice: 1000000,
      bedrooms: 0,
      bathrooms: 0,
      propertyType: 'all',
      community: 'all',
      listingType: 'all',
      minSquareFeet: 0,
      maxSquareFeet: 0,
      yearBuilt: 'all'
    });
  };

  // Handle listing type change
  const handleListingTypeChange = (type: 'sell' | 'rent') => {
    setListingType(type);
  };

  return (
    <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
      {/* Use the separated filter component */}
      <GlobalFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          communities={communities}
          locations={LOCATIONS}
          showLocation={true}
          showPropertyType={true}
          showCommunity={true}
          showPrice={false}
          showBedrooms={false}
          showBathrooms={false}
          layout="horizontal"
          className="w-full md:w-auto"
        />

        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium text-sm">
            {visibleProperties.length > 0 ? `${visibleProperties.length.toLocaleString()} properties` : 'No properties'}
          </span>
          <SellRentToggle 
              listingType={listingType}
              onListingTypeChange={handleListingTypeChange}
            />
            <ViewModeToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode}
            />
          </div>
        </div>
      
      
      {/* Property Listings and Map View */}
      {viewMode === 'map' ? (
        // Map View Only
        <div className="w-full bg-gray-100 rounded-lg overflow-hidden mb-10" style={{ height: '70vh' }}>
          <GooglePropertyMap
            theme="custom"
            properties={visibleProperties}
            selectedProperty={selectedProperty}
            onPropertySelect={(property) => {
              setSelectedProperty(property);
            }}
            onBoundsChange={handleBoundsChange}
            initialCenter={userLocation || defaultCenter}
            initialZoom={12}
            showFilters={true}
            filters={filters}
            handleFilterChange={handleFilterChange}
            resetFilters={resetFilters}
            communities={communities}
            locations={LOCATIONS}
          />
        </div>
      ) : viewMode === 'mixed' ? (
        // Mixed View (List + Map Side by Side)
        <div className="flex flex-col md:flex-row gap-4 mb-10" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Property Listings - Left Side with Scroll */}
          <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} overflow-y-auto pr-2`} style={{ maxHeight: '100%' }}>
            {loading && isInitialLoad ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleProperties.length > 0 ? (
                  visibleProperties.map((property, index) => (
                    <div 
                      key={`${property.mlsNumber}-${index}`}
                      className={`cursor-pointer transition-all ${selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-secondary' : ''}`}
                      onClick={() => handlePropertyClick(property)}
                    >
                      <PropertyCard 
                        property={property} 
                        onHide={() => hideProperty(property.mlsNumber)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500 text-lg">No properties found in this area.</p>
                    <p className="text-gray-400 text-sm mt-2">Move the map to explore different areas.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Map View - Right Side */}
          <div className={`${viewMode === 'mixed' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden flex-shrink-0`} style={{ height: '100%' }}>
            <GooglePropertyMap
              theme="custom"
              properties={visibleProperties}
              selectedProperty={selectedProperty}
              onPropertySelect={(property) => {
                setSelectedProperty(property);
              }}
              onBoundsChange={handleBoundsChange}
              initialCenter={userLocation || defaultCenter}
              initialZoom={12}
              showFilters={true}
              filters={filters}
              handleFilterChange={handleFilterChange}
              resetFilters={resetFilters}
              communities={communities}
              locations={LOCATIONS}
            />
          </div>
        </div>
      ) : (
        // List View Only (Grid)
        <>
          {loading && isInitialLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
              {[...Array(12)].map((_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
              {visibleProperties.length > 0 ? (
                visibleProperties.map((property, index) => (
                  <div 
                    key={`${property.mlsNumber}-${index}`}
                    className={`cursor-pointer transition-all ${selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-secondary' : ''}`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <PropertyCard 
                      property={property} 
                      onHide={() => hideProperty(property.mlsNumber)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 text-lg">No properties found in this area.</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or move the map to explore different areas.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Listings