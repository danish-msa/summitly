"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { getListings } from '@/lib/api/properties';
import { FaMapMarkerAlt, FaList } from 'react-icons/fa';
import PropertyCard from '@/components/Helper/PropertyCard';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import GlobalFilters from '@/components/common/filters/GlobalFilters';
import { LOCATIONS } from '@/lib/types/filters';
import dynamic from 'next/dynamic';
import { PropertyListing } from '@/lib/types';
import { MapVisiblePropertiesProvider, setGlobalCallback, getGlobalCallback } from './MapVisiblePropertiesContext';

// Dynamically import the Mapbox component with no SSR to avoid hydration issues
const MapboxPropertyMap = dynamic(() => import('@/components/MapSearch/MapboxPropertyMap'), { ssr: false });

// Remove the local PropertyListing interface since we're importing it from types.ts

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [mapDrivenProperties, setMapDrivenProperties] = useState<PropertyListing[]>([]); // Properties from map view
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [mapFilterEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 20
  });

  // Use global filters
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();

  // Use hidden properties hook
  const { hideProperty, getVisibleProperties } = useHiddenProperties();

  // Handle visible properties from map - use useCallback to ensure stable reference
  const handleVisiblePropertiesChange = useCallback((properties: PropertyListing[]) => {
    console.log('🔔 [Listings] handleVisiblePropertiesChange called with:', properties.length, 'properties');
    if (properties && Array.isArray(properties)) {
      console.log('✅ [Listings] Setting mapDrivenProperties with', properties.length, 'properties');
      setMapDrivenProperties(properties);
      console.log('🗺️ [MapSearch] Map visible properties updated:', properties.length);
    } else {
      console.warn('⚠️ [Listings] Received invalid properties:', properties);
      setMapDrivenProperties([]); // Clear on invalid input
    }
  }, []);
  
  // Set global callback IMMEDIATELY - this MUST happen before map component loads
  // Use useLayoutEffect to run synchronously before paint
  useLayoutEffect(() => {
    console.log('🔍 [Listings] useLayoutEffect: Setting global callback:', {
      type: typeof handleVisiblePropertiesChange,
      isFunction: typeof handleVisiblePropertiesChange === 'function',
      callbackValue: handleVisiblePropertiesChange,
    });
    try {
      setGlobalCallback(handleVisiblePropertiesChange);
      console.log('✅ [Listings] useLayoutEffect: setGlobalCallback called successfully');
    } catch (error) {
      console.error('❌ [Listings] useLayoutEffect: Error setting global callback:', error);
    }
    
    // Verify it was set immediately (synchronously)
    const global = getGlobalCallback();
    console.log('✅ [Listings] useLayoutEffect: Global callback verification:', {
      isSet: !!global,
      isFunction: typeof global === 'function',
      matches: global === handleVisiblePropertiesChange,
    });
  }, [handleVisiblePropertiesChange]);
  
  // Also set it in regular useEffect as backup (runs after paint)
  useEffect(() => {
    console.log('🔄 [Listings] useEffect: Setting global callback (backup)');
    try {
      setGlobalCallback(handleVisiblePropertiesChange);
      console.log('✅ [Listings] useEffect: setGlobalCallback called successfully');
    } catch (error) {
      console.error('❌ [Listings] useEffect: Error setting global callback:', error);
    }
    
    // Verify after a short delay
    const timeout = setTimeout(() => {
      const global = getGlobalCallback();
      console.log('✅ [Listings] useEffect: Global callback verification (delayed):', {
        isSet: !!global,
        isFunction: typeof global === 'function',
        matches: global === handleVisiblePropertiesChange,
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, [handleVisiblePropertiesChange]);

  // Reset loading state when switching to split/map view (properties come from map)
  // Also ensure callback is set when map view is enabled
  useEffect(() => {
    if (viewMode === 'split' || viewMode === 'map') {
      setLoading(false);
      // Ensure callback is set when map view is enabled
      console.log('🗺️ [Listings] Map view enabled, ensuring callback is set');
      setGlobalCallback(handleVisiblePropertiesChange);
      const global = getGlobalCallback();
      console.log('✅ [Listings] Callback check after enabling map view:', {
        isSet: !!global,
        isFunction: typeof global === 'function',
      });
    }
  }, [viewMode, handleVisiblePropertiesChange]);

  // Load properties with filters applied - ONLY for list-only view
  // For split/map view, properties come from the map component
  useEffect(() => {
    const loadProperties = async () => {
      // Only fetch for list-only view
      if (viewMode !== 'list') {
        return;
      }

      // Only show loading indicator on initial load, not when filtering
      if (properties.length === 0) {
        setLoading(true);
      }
      
      try {
        // Build base API parameters based on filters
        const baseParams: Record<string, string | number> = {
          status: "A" // Active listings
        };
        
        // Only add filters if they have values
        if (filters.minPrice > 0) baseParams.minPrice = filters.minPrice;
        if (filters.maxPrice < 2000000) baseParams.maxPrice = filters.maxPrice;
        if (filters.bedrooms > 0) baseParams.minBedrooms = filters.bedrooms;
        if (filters.bathrooms > 0) baseParams.minBaths = filters.bathrooms;
        if (filters.propertyType !== 'all') baseParams.propertyType = filters.propertyType;
        if (filters.community !== 'all') baseParams.community = filters.community;
        if (filters.listingType !== 'all') baseParams.listingType = filters.listingType;
        
        console.log('🔍 [MapSearch] Fetching properties for list view with params:', baseParams);
        
        // For list-only view, fetch listings with pagination
        const params = {
          ...baseParams,
          resultsPerPage: pagination.resultsPerPage,
          pageNum: pagination.currentPage,
        };
        
        const data = await getListings(params);
        console.log('📋 [MapSearch] List view API response:', data);
        
        if (data && data.listings) {
          setProperties(data.listings);
          
          // Update pagination info
          setPagination({
            ...pagination,
            totalPages: data.numPages || 1,
            totalResults: data.count || data.listings.length
          });
          
          // Extract unique communities from the data
          if (communities.length === 0) {
            const uniqueCommunities = Array.from(
              new Set(
                data.listings
                  .map(listing => listing.address.neighborhood)
                  .filter(Boolean) as string[]
              )
            ).sort();
            setCommunities(uniqueCommunities);
          }
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error('❌ [MapSearch] Error loading properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, viewMode, pagination.currentPage, pagination.resultsPerPage]);

  // Handle property card click
  const handlePropertyClick = (property: PropertyListing | null) => {
    setSelectedProperty(property);
  };


  // Handle map bounds change
  const handleMapBoundsChange = (bounds: {north: number; south: number; east: number; west: number}) => {
    setMapBounds(bounds);
  };


  // Determine which properties to show based on view mode
  // For split/map view: ALWAYS use map-driven properties (from map viewport)
  // For list view: use independently fetched properties
  const propertiesToShow = (viewMode === 'split' || viewMode === 'map')
    ? mapDrivenProperties  // Always use map properties for split/map view
    : properties;          // Use fetched properties for list-only view

  // Get visible properties (filtered properties minus hidden ones)
  const visibleProperties = getVisibleProperties(propertiesToShow);
  
  // Debug logging
  useEffect(() => {
    console.log('📊 [Listings] Properties state:', {
      viewMode,
      mapDrivenCount: mapDrivenProperties.length,
      fetchedCount: properties.length,
      propertiesToShowCount: propertiesToShow.length,
      visibleCount: visibleProperties.length,
    });
  }, [viewMode, mapDrivenProperties.length, properties.length, propertiesToShow.length, visibleProperties.length]);

  if (loading) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={viewMode === 'map' || viewMode === 'split' ? 'h-screen flex flex-col' : 'container mx-auto pt-10 pb-24 px-4'}>
      {/* Global Filters */}
      <div className={`bg-white flex-shrink-0 ${viewMode === 'map' || viewMode === 'split' ? 'px-4 py-3' : 'rounded-lg p-4 flex flex-col md:flex-row md:flex-wrap justify-between items-start md:items-center mt-8 mb-2 gap-4'}`}>
        <GlobalFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          communities={communities}
          locations={LOCATIONS}
          showLocation={true}
          showPropertyType={true}
          showCommunity={true}
          showPrice={true}
          showBedrooms={true}
          showBathrooms={true}
          layout="horizontal"
          className="w-full md:w-auto"
        />
        {/* View Mode Toggles */}
        <div className={`flex border rounded-md overflow-hidden ${viewMode === 'map' || viewMode === 'split' ? 'mt-2 md:mt-0' : ''}`}>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <FaList />
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={`px-3 py-2 ${viewMode === 'split' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <div className="flex gap-1">
                <FaList className="w-3" />
                <FaMapMarkerAlt className="w-3" />
              </div>
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 ${viewMode === 'map' ? 'bg-secondary text-white' : 'bg-white text-gray-700'}`}
            >
              <FaMapMarkerAlt />
            </button>
          </div>
      </div>


      <div className={`flex flex-1 min-h-0 ${viewMode === 'map' ? 'flex-col' : viewMode === 'list' ? 'flex-col' : 'flex-col md:flex-row'} gap-6 ${viewMode === 'map' || viewMode === 'split' ? 'px-4 pb-4' : ''}`}>
        {/* Property Listings - Shows map-driven properties for split/map view */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} overflow-y-auto`}>
            {/* Results Count */}
            <div className="flex items-center mb-2">
              <span className="text-gray-700 font-medium text-sm">
                {visibleProperties.length} {viewMode === 'split' ? 'properties on map' : 'results'}
              </span>
              {viewMode === 'split' && mapDrivenProperties.length === 0 && (
                <span className="text-gray-400 text-xs ml-2">(Loading from map...)</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {visibleProperties.length > 0 ? (
                visibleProperties.map((property) => (
                  <div 
                    key={property.mlsNumber}
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
                  <p className="text-gray-500 text-lg">
                    {viewMode === 'split'
                      ? 'No properties visible on the map. Pan or zoom to see properties.' 
                      : 'No properties match your current filters.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map View - Uses server-side clustering */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <MapVisiblePropertiesProvider onVisiblePropertiesChange={handleVisiblePropertiesChange}>
            <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} bg-gray-100 rounded-lg overflow-hidden flex-1 min-h-0`}>
              <MapboxPropertyMap 
                properties={mapDrivenProperties.length > 0 ? mapDrivenProperties : properties}
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertyClick}
                onBoundsChange={handleMapBoundsChange}
                onVisiblePropertiesChange={handleVisiblePropertiesChange}
                filters={filters}
                handleFilterChange={handleFilterChange}
                resetFilters={resetFilters}
                communities={communities}
                locations={LOCATIONS}
                showFilters={false}
              />
            </div>
          </MapVisiblePropertiesProvider>
        )}
      </div>
    </div>
  );
};

export default Listings