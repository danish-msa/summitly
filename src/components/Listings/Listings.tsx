"use client";

import React, { useMemo, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import PropertyCard from '@/components/Helper/PropertyCard';
import { PropertyListing } from '@/lib/types';
import { LOCATIONS, REGIONS, FilterState } from '@/lib/types/filters';
import SellRentToggle from '@/components/common/filters/SellRentToggle';
import { useHiddenProperties } from '@/hooks/useHiddenProperties';
import GlobalFilters from '../common/filters/GlobalFilters';
import { PropertyCardSkeleton } from '@/components/skeletons';
import { ViewModeToggle, type ViewMode } from '@/components/common/ViewModeToggle';
import { filterPropertiesByState } from '@/lib/utils/filterProperties';
import { getCoordinates } from '@/utils/locationUtils';
import DraggableDivider from '@/components/ui/draggable-divider';
import type { Cluster } from '@/lib/api/repliers';
import type { LngLat, LngLatBounds } from 'mapbox-gl';
import { LngLat as LngLatCtor, LngLatBounds as LngLatBoundsCtor } from 'mapbox-gl';

import { MapOptionsProvider, useMapOptions } from '@/features/map-search-v2/providers/MapOptionsProvider';
import MapRoot from '@/features/map-search-v2/components/MapRoot';
import MapService from '@/features/map-search-v2/services/map/MapService';
import SearchService from '@/features/map-search-v2/services/search/SearchService';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Pencil, PencilOff, X } from 'lucide-react';

// Default center (Toronto area) - fallback if geolocation fails
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

const ListingsMapDrawButton = ({
  polygon,
  setPolygon,
}: {
  polygon: Array<[number, number]> | null;
  setPolygon: React.Dispatch<React.SetStateAction<Array<[number, number]> | null>>;
}) => {
  const { mapRef } = useMapOptions();
  const [editMode, setEditMode] = useState<'draw' | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const map = mapRef.current;

  const updatePolygonFromDraw = useCallback(() => {
    const data = drawRef.current?.getAll()?.features;
    if (!data?.length) return;
    const feature = data[0];
    if (feature.geometry.type !== 'Polygon') return;
    const coords = (feature.geometry.coordinates?.[0] ?? []) as Array<[number, number]>;
    if (coords.length < 3) return;

    // Remove last coordinate if it closes the ring
    const last = coords.at(-1);
    const first = coords[0];
    const cleaned =
      last && first && last[0] === first[0] && last[1] === first[1]
        ? coords.slice(0, -1)
        : coords;
    setPolygon(cleaned);
  }, [setPolygon]);

  useEffect(() => {
    if (!map) return;

    if (editMode === 'draw') {
      if (!drawRef.current) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          defaultMode: 'draw_polygon',
          controls: { polygon: false, trash: false },
        });
        drawRef.current = draw;
        map.addControl(draw);
        map.on('draw.create', updatePolygonFromDraw);
        map.on('draw.update', updatePolygonFromDraw);
        map.on('draw.delete', () => setPolygon(null));
      } else {
        drawRef.current.changeMode('draw_polygon');
      }
    } else {
      if (drawRef.current) {
        map.off('draw.create', updatePolygonFromDraw);
        map.off('draw.update', updatePolygonFromDraw);
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    }

    return () => {
      if (!map) return;
      if (drawRef.current) {
        map.off('draw.create', updatePolygonFromDraw);
        map.off('draw.update', updatePolygonFromDraw);
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map, editMode, updatePolygonFromDraw, setPolygon]);

  const toggleDraw = () => {
    if (editMode === 'draw') {
      setEditMode(null);
    } else {
      setPolygon(null);
      setEditMode('draw');
    }
  };

  const clear = () => {
    setPolygon(null);
    setEditMode(null);
    drawRef.current?.deleteAll();
  };

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      <button
        type="button"
        onClick={toggleDraw}
        className={`h-10 w-10 rounded-lg shadow-md border border-white/60 backdrop-blur bg-white/80 flex items-center justify-center ${
          editMode === 'draw' ? 'ring-2 ring-primary' : ''
        }`}
        aria-label={editMode === 'draw' ? 'Exit draw mode' : 'Draw polygon'}
        title={editMode === 'draw' ? 'Exit draw mode' : 'Draw polygon'}
      >
        {editMode === 'draw' ? (
          <PencilOff className="h-5 w-5 text-primary" />
        ) : (
          <Pencil className="h-5 w-5 text-primary" />
        )}
      </button>

      {polygon && polygon.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="h-10 w-10 rounded-lg shadow-md border border-white/60 backdrop-blur bg-white/80 flex items-center justify-center"
          aria-label="Clear polygon"
          title="Clear polygon"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      )}
    </div>
  );
};

const Listings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
  // Initialize viewMode to 'mixed' - list view with both map and properties
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return 'mixed';
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
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationCenter, setLocationCenter] = useState<{lat: number; lng: number} | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapPosition, setMapPosition] = useState<{
    bounds: LngLatBounds | null;
    center: LngLat | null;
    zoom: number;
  }>({ bounds: null, center: null, zoom: 12 });
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [polygon, setPolygon] = useState<Array<[number, number]> | null>(null); // [lng,lat]
  const [splitPosition, setSplitPosition] = useState(50); // Percentage: 0-100, default 50% (equal split)
  const [gridColumns, setGridColumns] = useState(2); // Dynamic grid columns based on container width
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

  const effectiveFilters = useMemo<FilterState>(() => {
    return { ...filters, listingType };
  }, [filters, listingType]);
  
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

  // Ensure list view (map + properties) is selected on page load and clear any persisted state
  // Use useLayoutEffect to set it synchronously before paint
  useLayoutEffect(() => {
    // Only run once on mount
    if (viewModeInitializedRef.current) return;
    viewModeInitializedRef.current = true;

    // Clear any localStorage that might be persisting viewMode
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('viewmode') || lowerKey.includes('view-mode') || lowerKey.includes('view_mode')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Force set to 'mixed' (list view: both map and properties)
    setViewMode('mixed');
    
    console.log('[Listings] Initialized viewMode to:', 'mixed');
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

  // List-only view still needs results even without a map mounted.
  // We approximate a viewport around the current center and reuse the same v2 search pipeline.
  useEffect(() => {
    if (viewMode !== 'list') return;

    const center = locationCenter || userLocation || defaultCenter;
    const delta = 0.2; // ~20km-ish depending on latitude; good enough as a default viewport
    const bounds = new LngLatBoundsCtor(
      [center.lng - delta, center.lat - delta],
      [center.lng + delta, center.lat + delta]
    );

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const resp = await SearchService.fetch({
          bounds,
          polygon: null,
          zoom: 12,
          pageNum: 1,
          resultsPerPage: 200,
          status: 'A',
          filters: effectiveFilters,
          city: null,
        });

        if (!resp || cancelled) return;
        setProperties(resp.list);
        setClusters(resp.clusters);
        const uniqueCommunities = Array.from(
          new Set(resp.list.map((l) => l.address?.neighborhood).filter(Boolean) as string[])
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('[Listings] List-mode fetch failed:', error);
        setProperties([]);
        setClusters([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [viewMode, locationCenter, userLocation, effectiveFilters]);

  // New v2 pipeline (map-driven):
  // map position | filters | polygon -> fetch -> save -> MapService.update()
  useEffect(() => {
    const shouldFetch = viewMode === 'map' || viewMode === 'mixed';
    if (!shouldFetch) return;
    if (!mapLoaded) return;
    if (!mapPosition.bounds) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const resp = await SearchService.fetch({
          bounds: mapPosition.bounds,
          polygon,
          zoom: mapPosition.zoom,
          pageNum: 1,
          resultsPerPage: 200,
          status: 'A',
          filters: effectiveFilters,
          city: null,
        });

        if (!resp || cancelled) return;

        setProperties(resp.list);
        setClusters(resp.clusters);
        MapService.update(resp.list, resp.clusters, resp.count);

        const uniqueCommunities = Array.from(
          new Set(resp.list.map((l) => l.address?.neighborhood).filter(Boolean) as string[])
        ).sort();
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error('[Listings] Map search fetch failed:', error);
        setProperties([]);
        setClusters([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [viewMode, mapLoaded, mapPosition, polygon, effectiveFilters]);

  // Handle property card click
  const handlePropertyClick = (property: PropertyListing | null) => {
    setSelectedProperty(property);
  };

  const handleMapLoad = useCallback((bounds: LngLatBounds, center: LngLat, zoom: number) => {
    setMapLoaded(true);
    setMapPosition({ bounds, center, zoom });
  }, []);

  const handleMapMove = useCallback((bounds: LngLatBounds, center: LngLat, zoom: number) => {
    setMapPosition({ bounds, center, zoom });
  }, []);

  const mapCenterLngLat = useMemo(() => {
    const c = locationCenter || userLocation || defaultCenter;
    return new LngLatCtor(c.lng, c.lat);
  }, [locationCenter, userLocation]);

  // Keep markers/clusters in sync with fetched + client-filtered data
  useEffect(() => {
    if (viewMode !== 'map' && viewMode !== 'mixed') return;
    MapService.showMarkers({
      properties: visibleProperties,
      onClick: (_e, p) => {
        setSelectedProperty(p);
        // If user is in map-only mode, switch to split so they can see the highlighted card
        if (viewMode === 'map') setViewMode('mixed');
      },
      onTap: (p) => {
        setSelectedProperty(p);
        if (viewMode === 'map') setViewMode('mixed');
      },
    });
  }, [viewMode, visibleProperties]);

  useEffect(() => {
    if (viewMode !== 'map' && viewMode !== 'mixed') return;
    MapService.showClusterMarkers({ clusters });
  }, [viewMode, clusters]);

  // When a marker is selected, scroll the corresponding card into view
  useEffect(() => {
    if (!selectedProperty?.mlsNumber) return;
    if (viewMode !== 'mixed' && viewMode !== 'list') return;

    const id = `listing-card-${selectedProperty.mlsNumber}`;

    // Wait a tick so the DOM exists (especially after switching view modes)
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    return () => window.clearTimeout(t);
  }, [selectedProperty?.mlsNumber, viewMode]);

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
      // Resize Mapbox map after dragging ends
      MapService.map?.resize();
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

  // Ensure Mapbox map resizes when layout changes
  useEffect(() => {
    if (viewMode !== 'map' && viewMode !== 'mixed') return;
    const t = setTimeout(() => {
      MapService.map?.resize();
    }, 50);
    return () => clearTimeout(t);
  }, [viewMode, splitPosition]);

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
    <MapOptionsProvider initialLayout="split">
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
        <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
          <div className="relative w-full h-full">
            <MapRoot
              zoom={mapPosition.zoom}
              center={mapCenterLngLat}
              polygon={polygon}
              onMove={handleMapMove}
              onLoad={handleMapLoad}
            />
            <ListingsMapDrawButton polygon={polygon} setPolygon={setPolygon} />
          </div>
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
                      id={`listing-card-${property.mlsNumber}`}
                      key={`${property.mlsNumber}-${index}`}
                      className={`cursor-pointer transition-all h-full ${selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-secondary' : ''}`}
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
            <div className="relative w-full h-full">
              <MapRoot
                zoom={mapPosition.zoom}
                center={mapCenterLngLat}
                polygon={polygon}
                onMove={handleMapMove}
                onLoad={handleMapLoad}
              />
              <ListingsMapDrawButton polygon={polygon} setPolygon={setPolygon} />
            </div>
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
                      id={`listing-card-${property.mlsNumber}`}
                    key={`${property.mlsNumber}-${index}`}
                    className={`cursor-pointer transition-all h-full ${selectedProperty?.mlsNumber === property.mlsNumber ? 'ring-2 ring-secondary' : ''}`}
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
    </MapOptionsProvider>
  );
};

export default Listings