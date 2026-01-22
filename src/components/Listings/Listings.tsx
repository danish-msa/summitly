"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
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
import { getCoordinates } from '@/utils/locationUtils';
import DraggableDivider from '@/components/ui/draggable-divider';

// Dynamically import the universal map component (switches between Google Maps and Mapbox)
const PropertyMap = dynamic(() => import('@/components/MapSearch/PropertyMap'), { ssr: false });

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
  // Initialize viewMode to 'list' - this is the grid view (LayoutGrid icon)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Always return 'list' on initial mount, ignore any potential localStorage
    return 'list';
  });
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
  const [locationCenter, setLocationCenter] = useState<{lat: number; lng: number} | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50); // Percentage: 0-100, default 50% (equal split)
  const [gridColumns, setGridColumns] = useState(2); // Dynamic grid columns based on container width
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousLocationRef = useRef<{location: string; area: string} | null>(null);
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const propertiesContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapResizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use hidden properties hook
  const { hideProperty, getVisibleProperties } = useHiddenProperties();

  // Apply filters to properties
  const filteredProperties = filterPropertiesByState(properties, filters);

  // Get visible properties (filtered properties minus hidden ones)
  const visibleProperties = getVisibleProperties(filteredProperties);
  
  // Debug logging
  useEffect(() => {
    console.log('[Listings] Properties count:', {
      total: properties.length,
      filtered: filteredProperties.length,
      visible: visibleProperties.length,
      locationCenter: locationCenter,
      filters: { location: filters.location, locationArea: filters.locationArea },
      viewMode: viewMode
    });
    
    // Log sample properties to see what's being filtered
    if (filteredProperties.length > 0) {
      console.log('[Listings] Sample filtered property:', {
        city: filteredProperties[0].address?.city,
        neighborhood: filteredProperties[0].address?.neighborhood,
        area: filteredProperties[0].address?.area
      });
    }
  }, [properties.length, filteredProperties.length, visibleProperties.length, locationCenter, filters.location, filters.locationArea, viewMode]);

  // Track if we've initialized the view mode
  const viewModeInitializedRef = useRef(false);

  // Ensure list view is selected on page load and clear any persisted state
  // Use useLayoutEffect to set it synchronously before paint
  useLayoutEffect(() => {
    // Only run once on mount
    if (viewModeInitializedRef.current) return;
    viewModeInitializedRef.current = true;

    // Clear any localStorage that might be persisting viewMode
    if (typeof window !== 'undefined') {
      // Clear all possible localStorage keys related to viewMode
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('viewmode') || lowerKey.includes('view-mode') || lowerKey.includes('view_mode')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Force set to 'list' view immediately - this activates the LayoutGrid button (Grid View)
    // Note: 'list' viewMode = Grid View button (LayoutGrid icon)
    setViewMode('list');
    
    // Log for debugging
    console.log('[Listings] Initialized viewMode to:', 'list');
  }, []);

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

  // Geocode selected location and update map center
  // This effect runs whenever location filters change
  useEffect(() => {
    // Clear any pending geocoding
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }

    // Check if location actually changed
    const currentLocation = {
      location: filters.location,
      area: filters.locationArea
    };

    console.log('[Listings] Geocoding effect - Current location:', currentLocation);
    console.log('[Listings] Geocoding effect - Previous location:', previousLocationRef.current);

    // If location hasn't changed, don't re-geocode
    if (
      previousLocationRef.current &&
      previousLocationRef.current.location === currentLocation.location &&
      previousLocationRef.current.area === currentLocation.area
    ) {
      console.log('[Listings] Location unchanged, skipping geocoding');
      return;
    }

    // Update previous location BEFORE geocoding to prevent duplicate calls
    previousLocationRef.current = currentLocation;
    console.log('[Listings] Location changed, will geocode');

    const geocodeLocation = async () => {
      // If location is reset to 'all', clear location center
      if (filters.location === 'all' || filters.locationArea === 'all') {
        setLocationCenter(null);
        return;
      }

      // Get the city name from the selected location
      const region = REGIONS.find(reg => reg.id === filters.location);
      if (!region) {
        console.warn('Region not found for:', filters.location);
        return;
      }

      // Use the selected city/area
      const cityName = filters.locationArea;
      if (!cityName || cityName === 'all') {
        console.warn('City name is invalid:', cityName);
        return;
      }

      // Geocode the city name to get coordinates
      try {
        // Add "Ontario, Canada" for better geocoding accuracy
        const address = `${cityName}, Ontario, Canada`;
        console.log('[LocationFilter] Geocoding address:', address);
        const coordinates = await getCoordinates(address);
        
        if (coordinates) {
          console.log('[LocationFilter] Geocoded coordinates:', coordinates);
          // Always create a new object with a unique key to force React update
          const newCenter = { 
            lat: coordinates.lat, 
            lng: coordinates.lng 
          };
          console.log('[LocationFilter] Setting location center:', newCenter);
          setLocationCenter(newCenter);
        } else {
          console.warn(`[LocationFilter] Could not geocode location: ${cityName}`);
          setLocationCenter(null);
        }
      } catch (error) {
        console.error('[LocationFilter] Error geocoding location:', error);
        setLocationCenter(null);
      }
    };

    // Small delay to debounce rapid filter changes
    geocodingTimeoutRef.current = setTimeout(() => {
      geocodeLocation();
    }, 100);

    // Cleanup
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, [filters.location, filters.locationArea]);

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
      
      // Note: Location filter is NOT added here - it's only used to move the map center
      // The map should show properties for any area the user navigates to, not just the selected location
      // Location filter is handled separately via locationCenter to move the map view
      
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
      console.log('[Listings] Location filter changed:', { location: value.location, area: value.area });
      
      // Reset previous location ref to force geocoding
      previousLocationRef.current = null;
      
      // Update filters - this will trigger the useEffect
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

  // Track if we're currently dragging for performance optimizations
  const isDraggingRef = useRef(false);
  
  // Handle split position change from draggable divider
  const handleSplitPositionChange = (newPosition: number) => {
    // Update position immediately for smooth visual feedback
    setSplitPosition(newPosition);
    
    // Mark that we're dragging
    isDraggingRef.current = true;
    
    // Throttle expensive map resize operations
    // Clear any pending resize
    if (mapResizeTimeoutRef.current) {
      clearTimeout(mapResizeTimeoutRef.current);
    }
    
    // Debounce map resize - only trigger after user stops dragging
    mapResizeTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      // Trigger window resize event to help maps detect size change
      // This is a backup in case ResizeObserver doesn't catch it
      window.dispatchEvent(new Event('resize'));
      mapResizeTimeoutRef.current = null;
    }, 100); // Reduced from 150ms for faster response
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mapResizeTimeoutRef.current) {
        clearTimeout(mapResizeTimeoutRef.current);
      }
    };
  }, []);

  // Calculate grid columns based on container width
  useEffect(() => {
    if (!propertiesContainerRef.current || viewMode !== 'mixed') return;

    const calculateColumns = () => {
      const container = propertiesContainerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      // Minimum card width: ~280px (including gap)
      // Gap: 16px (gap-4 = 1rem = 16px)
      const minCardWidth = 280;
      const gap = 16;
      
      // Calculate how many columns can fit
      // Formula: (containerWidth + gap) / (minCardWidth + gap)
      const columns = Math.max(1, Math.floor((containerWidth + gap) / (minCardWidth + gap)));
      
      // Cap at 4 columns max for better UX
      setGridColumns(Math.min(columns, 4));
    };

    // Calculate on mount and when split position changes
    calculateColumns();

    // Use ResizeObserver to recalculate when container resizes
    const resizeObserver = new ResizeObserver(() => {
      calculateColumns();
    });

    resizeObserver.observe(propertiesContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [splitPosition, viewMode]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-20">
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
          showCommunity={false}
          showPrice={false}
          showBedrooms={false}
          showBathrooms={false}
          showResetButton={false}
          layout="horizontal"
          className="w-full md:w-auto"
        />

        <div className="flex items-center gap-2">
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
          <PropertyMap
            theme="custom"
            properties={visibleProperties}
            selectedProperty={selectedProperty}
            onPropertySelect={(property: PropertyListing | null) => {
              setSelectedProperty(property);
            }}
            onBoundsChange={handleBoundsChange}
            initialCenter={userLocation || defaultCenter}
            initialZoom={12}
            locationCenter={locationCenter}
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
        <div 
          ref={splitContainerRef}
          className="flex flex-col md:flex-row mb-10 relative" 
          style={{ 
            height: 'calc(100vh - 200px)',
            // Optimize container for smooth dragging
            contain: 'layout style',
            willChange: 'contents'
          } as React.CSSProperties}
        >
          {/* Property Listings - Left Side with Scroll */}
          <div 
            ref={propertiesContainerRef}
            className="overflow-y-auto pr-2 flex-shrink-0" 
            style={{ 
              width: `calc(${splitPosition}% - 4px)`,
              maxHeight: '100%',
              // Advanced CSS optimizations for smooth resizing
              willChange: 'width',
              contain: 'layout style paint', // Limit reflow scope
              transition: 'none', // Disable transitions during drag
              backfaceVisibility: 'hidden', // Force hardware acceleration
              transform: 'translateZ(0)' // Create new layer for GPU acceleration
            } as React.CSSProperties}
          >
            {loading && isInitialLoad ? (
              <div 
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
              >
                {[...Array(6)].map((_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div 
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
              >
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

          {/* Draggable Divider */}
          <div className="hidden md:flex flex-shrink-0">
            <DraggableDivider
              position={splitPosition}
              onPositionChange={handleSplitPositionChange}
              minPosition={25}
              maxPosition={75}
              orientation="vertical"
              containerRef={splitContainerRef as React.RefObject<HTMLElement>}
            />
          </div>

          {/* Map View - Right Side */}
          <div 
            ref={mapContainerRef}
            className="bg-gray-100 rounded-lg overflow-hidden flex-shrink-0" 
            style={{ 
              width: `calc(${100 - splitPosition}% - 4px)`,
              height: '100%',
              minWidth: 0,
              // Advanced CSS optimizations for smooth resizing
              willChange: 'width',
              contain: 'layout style paint', // Limit reflow scope
              transition: 'none', // Disable transitions during drag
              backfaceVisibility: 'hidden', // Force hardware acceleration
              transform: 'translateZ(0)' // Create new layer for GPU acceleration
            } as React.CSSProperties}
          >
            <PropertyMap
              theme="custom"
              properties={visibleProperties}
              selectedProperty={selectedProperty}
              onPropertySelect={(property: PropertyListing | null) => {
                setSelectedProperty(property);
              }}
              onBoundsChange={handleBoundsChange}
              initialCenter={userLocation || defaultCenter}
              initialZoom={12}
              locationCenter={locationCenter}
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
        // List View Only (Grid) - Responsive columns based on container width
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