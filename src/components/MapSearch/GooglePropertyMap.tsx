"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useRouter } from 'next/navigation';
import { Plus, Minus, X } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { getPropertyUrl } from '@/lib/utils/propertyUrl';
import { getThemeStyles, type MapTheme, activeTheme } from '@/lib/constants/mapThemes';
import { MapFilterPanel } from './MapFilterPanel';
import { FilterComponentProps } from '@/lib/types/filters';
import { LOCATIONS } from '@/lib/types/filters';

interface GooglePropertyMapProps {
  properties: PropertyListing[];
  selectedProperty: PropertyListing | null;
  onPropertySelect: (property: PropertyListing | null) => void;
  onBoundsChange: (bounds: {north: number; south: number; east: number; west: number}) => void;
  theme?: MapTheme; // Optional theme prop, defaults to activeTheme
  initialCenter?: {lat: number; lng: number}; // Initial map center
  initialZoom?: number; // Initial map zoom level
  locationCenter?: {lat: number; lng: number} | null; // Location-based center (updates map when filter changes)
  showFilters?: boolean; // Show/hide filter panel
  isPreCon?: boolean; // Is this for pre-construction projects
  showPreConStatus?: boolean; // Show pre-construction status filter
  // Filter props (optional - only needed if showFilters is true)
  filters?: FilterComponentProps['filters'];
  handleFilterChange?: FilterComponentProps['handleFilterChange'];
  resetFilters?: FilterComponentProps['resetFilters'];
  communities?: FilterComponentProps['communities'];
  locations?: FilterComponentProps['locations'];
  // Subject property for relative filtering (optional)
  subjectProperty?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    sqftAboveGrade?: number;
    sqftBelowGrade?: number;
    lotSize?: number;
    propertyType?: string;
    yearBuilt?: number;
    listPrice?: number;
    salePrice?: number;
    listDate?: string;
    saleDate?: string;
    status?: string;
    location?: { lat: number; lng: number };
  };
}

// Map container styles
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Toronto area)
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

const GooglePropertyMap: React.FC<GooglePropertyMapProps> = ({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  onBoundsChange,
  theme = activeTheme,
  initialCenter,
  initialZoom = 10,
  locationCenter,
  showFilters = false,
  isPreCon = false,
  showPreConStatus = false,
  filters,
  handleFilterChange,
  resetFilters,
  communities = [],
  locations = LOCATIONS,
  subjectProperty
}) => {
  // Get map options with theme styles
  const mapOptions = React.useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: false, // Disable default zoom controls - we'll use custom ones
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: getThemeStyles(theme)
  }), [theme]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const router = useRouter();
  const [infoWindow, setInfoWindow] = useState<{
    property: PropertyListing;
    position: google.maps.LatLng;
  } | null>(null);
  const isInitialFitRef = useRef<boolean>(false);
  const isProgrammaticUpdateRef = useRef<boolean>(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerIconCacheRef = useRef<Map<string, google.maps.Icon>>(new Map());
  const previousPropertiesRef = useRef<Set<string>>(new Set());

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Clustering configuration
  // MarkerClusterer automatically handles dynamic clustering based on zoom level
  // As you zoom in, clusters break apart naturally into smaller clusters or individual markers
  
  // Initialize marker clusterer with custom secondary color
  // The clusterer will automatically adjust clusters based on zoom level
  const initializeClusterer = useCallback((map: google.maps.Map) => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // Secondary color: #1AC0EB
    const secondaryColor = '#1AC0EB';
    
    // Custom renderer for clusters with secondary color
    const renderer = {
      render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
        // Calculate cluster size based on count
        const size = count < 10 ? 40 : count < 100 ? 50 : 60;
        const fontSize = count < 10 ? '12px' : count < 100 ? '14px' : '16px';
        
        // Format large numbers (e.g., 1000 -> 1K)
        const displayCount = count >= 1000 ? `${(count / 1000).toFixed(0)}K` : count.toString();
        
        // Create SVG icon with secondary color
        const svg = `
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${secondaryColor}" stroke="white" stroke-width="2"/>
            <text x="${size/2}" y="${size/2 + (size * 0.15)}" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif">${displayCount}</text>
          </svg>
        `;
        
        const encodedSvg = encodeURIComponent(svg);
        
        return new google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodedSvg}`,
            scaledSize: new google.maps.Size(size, size),
            anchor: new google.maps.Point(size / 2, size / 2)
          },
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });
      },
    };

    // Create clusterer with aggressive clustering at lower zoom levels
    // Configuration ensures all markers are clustered at wide zoom levels
    // Individual markers only appear when zoomed in close enough
    const clustererOptions: any = {
      map,
      markers: markersRef.current,
      renderer,
      algorithmOptions: {
        // Higher maxZoom means clustering happens at more zoom levels
        // Set to 15 so clustering continues until very close zoom (individual markers only at zoom 16+)
        maxZoom: 15,
        // Larger maxDistance means markers further apart still get clustered
        // This ensures at wide zoom levels, all markers are in clusters
        maxDistance: 40000, // Increased from default (10000) to cluster markers that are further apart at low zoom
      },
    };
    
    clustererRef.current = new MarkerClusterer(clustererOptions);
  }, []);

  // Memoize marker icon creation
  const createMarkerIcon = useCallback((priceText: string, isSelected: boolean): google.maps.Icon => {
    const cacheKey = `${priceText}-${isSelected}`;
    
    // Check cache first
    if (markerIconCacheRef.current.has(cacheKey)) {
      return markerIconCacheRef.current.get(cacheKey)!;
    }

    // Calculate width based on price text length
    const textWidth = priceText.length * 7 + 20;
    const markerWidth = Math.max(60, textWidth);
    const markerHeight = 28;
    // Use half of height for rounded-full effect
    const borderRadius = markerHeight / 2;
    
    const icon: google.maps.Icon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="${markerWidth}" height="${markerHeight}" viewBox="0 0 ${markerWidth} ${markerHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect 
            x="0" 
            y="0" 
            width="${markerWidth}" 
            height="${markerHeight}" 
            rx="${borderRadius}" 
            ry="${borderRadius}" 
            fill="white" 
            stroke="${isSelected ? '#e74c3c' : '#e5e7eb'}" 
            stroke-width="${isSelected ? '2' : '1'}"
          />
          <text 
            x="${markerWidth / 2}" 
            y="${markerHeight / 2 + 4}" 
            text-anchor="middle" 
            fill="#000000" 
            font-size="12" 
            font-weight="600" 
            font-family="Arial, sans-serif"
          >${priceText}</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(markerWidth, markerHeight),
      anchor: new google.maps.Point(markerWidth / 2, markerHeight / 2)
    };

    // Cache the icon (limit cache size to prevent memory issues)
    if (markerIconCacheRef.current.size > 100) {
      const firstKey = markerIconCacheRef.current.keys().next().value;
      if (firstKey) {
        markerIconCacheRef.current.delete(firstKey);
      }
    }
    markerIconCacheRef.current.set(cacheKey, icon);
    
    return icon;
  }, []);

  // Create property markers with incremental updates
  const createMarkers = useCallback((map: google.maps.Map) => {
    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0) {
      // Clear all markers if no valid properties
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      return;
    }

    // Create a map of current property IDs for quick lookup
    const currentPropertyIds = new Set(validProperties.map(p => p.mlsNumber));
    const markerMap = new Map(markersRef.current.map(m => {
      // Try to find the property for this marker by position
      const pos = m.getPosition();
      if (!pos) return null;
      const prop = validProperties.find(p => 
        Math.abs(p.map.latitude! - pos.lat()) < 0.0001 &&
        Math.abs(p.map.longitude! - pos.lng()) < 0.0001
      );
      return prop ? [prop.mlsNumber, { marker: m, property: prop }] : null;
    }).filter(Boolean) as Array<[string, { marker: google.maps.Marker; property: PropertyListing }]>);

    // Remove markers for properties that no longer exist
    const markersToRemove: google.maps.Marker[] = [];
    markerMap.forEach(({ marker }, mlsNumber) => {
      if (!currentPropertyIds.has(mlsNumber)) {
        markersToRemove.push(marker);
        markerMap.delete(mlsNumber);
      }
    });
    markersToRemove.forEach(marker => {
      marker.setMap(null);
      const index = markersRef.current.indexOf(marker);
      if (index > -1) markersRef.current.splice(index, 1);
    });

    // Update existing markers or create new ones
    validProperties.forEach(property => {
      if (!property.map.latitude || !property.map.longitude) return;

      const priceText = `$${(property.listPrice / 1000).toFixed(0)}K`;
      const isSelected = selectedProperty?.mlsNumber === property.mlsNumber;
      
      const existing = markerMap.get(property.mlsNumber);
      
      if (existing) {
        // Update existing marker icon if selection changed
        if (existing.property.mlsNumber !== property.mlsNumber || 
            (selectedProperty?.mlsNumber === property.mlsNumber) !== (selectedProperty?.mlsNumber === existing.property.mlsNumber)) {
          const icon = createMarkerIcon(priceText, isSelected);
          existing.marker.setIcon(icon);
        }
        // Update position if it changed
        const pos = existing.marker.getPosition();
        if (!pos || 
            Math.abs(pos.lat() - property.map.latitude!) > 0.0001 ||
            Math.abs(pos.lng() - property.map.longitude!) > 0.0001) {
          existing.marker.setPosition({
            lat: property.map.latitude!,
            lng: property.map.longitude!
          });
        }
        existing.property = property;
      } else {
        // Create new marker
        // Don't set map directly - let the clusterer manage marker visibility
        const icon = createMarkerIcon(priceText, isSelected);
        const marker = new google.maps.Marker({
          position: {
            lat: property.map.latitude!,
            lng: property.map.longitude!
          },
          map: null, // Clusterer will manage visibility
          icon,
          title: `${property.details.propertyType} - $${property.listPrice.toLocaleString()}`
        });

        // Add click event to marker
        marker.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.domEvent) {
            e.domEvent.stopPropagation();
          }
          onPropertySelect(property);
          setInfoWindow({
            property,
            position: marker.getPosition()!
          });
        });

        markersRef.current.push(marker);
        markerMap.set(property.mlsNumber, { marker, property });
      }
    });

    // Update clusterer with current markers
    // MarkerClusterer automatically handles dynamic clustering:
    // - At low zoom: Large clusters (e.g., 1K, 419, 286)
    // - As you zoom in: Clusters break into smaller clusters (e.g., 410, 113, 30)
    // - At high zoom: Individual price tags appear alongside small clusters
    
    // Ensure all markers are properly managed by the clusterer
    // Remove markers from map if they were added directly (shouldn't happen, but safety check)
    markersRef.current.forEach(marker => {
      if (marker.getMap() && !clustererRef.current) {
        // Only remove if clusterer doesn't exist yet
        marker.setMap(null);
      }
    });
    
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markersRef.current);
    } else {
      initializeClusterer(map);
    }
    
    // Debug: Log marker count
    console.log(`[GooglePropertyMap] Total markers: ${markersRef.current.length}, Properties: ${validProperties.length}`);
  }, [properties, selectedProperty, onPropertySelect, initializeClusterer, createMarkerIcon]);

  // Handle map click to deselect property (like onTap in Flutter)
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    // Only deselect if clicking directly on the map (not on a marker)
    // Markers will stop propagation in their click handlers
    if (e.latLng) {
      onPropertySelect(null);
      setInfoWindow(null);
    }
  }, [onPropertySelect]);


  // Throttled bounds change handler
  const throttledBoundsChange = useCallback((bounds: google.maps.LatLngBounds) => {
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }
    
    boundsChangeTimeoutRef.current = setTimeout(() => {
      if (!isProgrammaticUpdateRef.current && mapRef.current) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng()
        });
      }
    }, 150); // Throttle to 150ms
  }, [onBoundsChange]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Set initial center and zoom - prioritize locationCenter over initialCenter
    if (locationCenterRef.current) {
      map.setCenter(locationCenterRef.current);
      map.setZoom(12);
    } else if (initialCenter) {
      map.setCenter(initialCenter);
      map.setZoom(initialZoom);
    }
    
    // Trigger initial bounds change
    const initialBounds = map.getBounds();
    if (initialBounds) {
      onBoundsChange({
        north: initialBounds.getNorthEast().lat(),
        south: initialBounds.getSouthWest().lat(),
        east: initialBounds.getNorthEast().lng(),
        west: initialBounds.getSouthWest().lng()
      });
    }
    
    // Add throttled bounds change listener
    map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        throttledBoundsChange(bounds);
      }
    });

    // Note: MarkerClusterer automatically handles zoom changes internally
    // It will re-cluster markers as you zoom in/out, breaking clusters apart naturally
    // No manual zoom listener needed - the clusterer does this automatically

    // Add map click listener to deselect property
    map.addListener('click', handleMapClick);

    // Create initial markers
    createMarkers(map);
  }, [createMarkers, onBoundsChange, handleMapClick, initialCenter, initialZoom, throttledBoundsChange, initializeClusterer]);

  // Update markers when properties change
  useEffect(() => {
    if (mapRef.current) {
      createMarkers(mapRef.current);
    }
  }, [createMarkers]);

  // Center map on selected property
  useEffect(() => {
    if (!mapRef.current || !selectedProperty || !selectedProperty.map.latitude || !selectedProperty.map.longitude) return;

    isProgrammaticUpdateRef.current = true;
    const position = {
      lat: selectedProperty.map.latitude!,
      lng: selectedProperty.map.longitude!
    };

    mapRef.current.panTo(position);
    const currentZoom = mapRef.current.getZoom() || 10;
    if (currentZoom < 12) {
      mapRef.current.setZoom(12);
    }

    // Show info window for selected property
    setInfoWindow({
      property: selectedProperty,
      position: new google.maps.LatLng(position.lat, position.lng)
    });

    // Reset flag immediately (no delay needed)
    requestAnimationFrame(() => {
      isProgrammaticUpdateRef.current = false;
    });
  }, [selectedProperty]);

  // Store locationCenter in a ref to access it in onMapLoad
  const locationCenterRef = useRef(locationCenter);
  useEffect(() => {
    locationCenterRef.current = locationCenter;
  }, [locationCenter]);

  // Update map center when location filter changes (optimized)
  useEffect(() => {
    if (!locationCenter || !mapRef.current) return;

    isProgrammaticUpdateRef.current = true;
    const newPosition = new google.maps.LatLng(locationCenter.lat, locationCenter.lng);
    
    // Use panTo for smooth transition (no setTimeout needed)
    mapRef.current.panTo(newPosition);
    mapRef.current.setZoom(12);
    
    // Reset flag on next frame
    requestAnimationFrame(() => {
      isProgrammaticUpdateRef.current = false;
    });
  }, [locationCenter]);

  // Fit map to show all properties (only if no initial center is provided)
  useEffect(() => {
    if (!mapRef.current || properties.length === 0 || initialCenter || locationCenter) return;

    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0) return;

    // Only auto-fit bounds on initial load if no initial center was provided
    if (!isInitialFitRef.current) {
      const bounds = new google.maps.LatLngBounds();
      validProperties.forEach(property => {
        bounds.extend({
          lat: property.map.latitude!,
          lng: property.map.longitude!
        });
      });

      isProgrammaticUpdateRef.current = true;
      mapRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });

      // Reset flag on next frame
      requestAnimationFrame(() => {
        isProgrammaticUpdateRef.current = false;
      });

      isInitialFitRef.current = true;
    }
  }, [properties, initialCenter, locationCenter]);

  const handleInfoWindowClose = () => {
    setInfoWindow(null);
  };

  const handleViewProperty = (property: PropertyListing) => {
    router.push(getPropertyUrl(property));
  };

  // Handle zoom in
  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      mapRef.current.setZoom(Math.min(currentZoom + 1, 20));
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      mapRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  // Handle search place selection

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Filter Panel - Left Side */}
      {showFilters && filters && handleFilterChange && resetFilters && (
        <MapFilterPanel
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          communities={communities}
          locations={locations}
          isPreCon={isPreCon}
          showPreConStatus={showPreConStatus}
          subjectProperty={subjectProperty}
        />
      )}

      {/* Custom Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer border-none"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer border-none"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter || defaultCenter}
        zoom={initialZoom}
        onLoad={onMapLoad}
        options={mapOptions}
      >
        {/* Info Window */}
        {infoWindow && (() => {
          const property = infoWindow.property;
          const isRental = property.type === 'Lease';
          const priceText = isRental 
            ? `$${property.listPrice.toLocaleString()} / month`
            : `$${property.listPrice.toLocaleString()}`;
          const bedrooms = property.details.numBedrooms || 0;
          const bathrooms = property.details.numBathrooms || 0;
          const sqft = typeof property.details.sqft === 'number' 
            ? property.details.sqft 
            : typeof property.details.sqft === 'string' 
              ? parseInt(property.details.sqft.replace(/,/g, '')) || 0 
              : 0;
          // Build location from streetNumber, streetName, and streetSuffix
          const locationParts = [
            property.address.streetNumber,
            property.address.streetName,
            property.address.streetSuffix
          ].filter(Boolean);
          const location = locationParts.join(' ') || '';

          return (
            <InfoWindow
              position={infoWindow.position}
              onCloseClick={handleInfoWindowClose}
              options={{
                pixelOffset: new google.maps.Size(0, -10),
                disableAutoPan: false,
                maxWidth: 260,
                minWidth: 260,
              }}
            >
              <div className="property-info-window bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ width: '220px', padding: '0', margin: '0' }}>
                {/* Close Button */}
                <button
                  onClick={handleInfoWindowClose}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-4 h-4 text-zinc-700" />
                </button>
                
                {/* Image Section */}
                <div className="relative w-full h-20 overflow-hidden rounded-t-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={property.images.imageUrl} 
                    alt={property.details.propertyType || 'Property'}
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '12px 12px 0 0' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/p1.jpg';
                    }}
                  />
                </div>
                
                {/* Content Section */}
                <div className="p-3 space-y-1">
                  {/* Price - Largest, Boldest */}
                  <div className="text-base font-bold leading-tight">
                    {priceText}
                  </div>
                  
                  {/* Property Metrics - Medium size */}
                  <div className="text-xs text-primary">
                    {bedrooms} Bed{bedrooms !== 1 ? 's' : ''}, {bathrooms} Bath{bathrooms !== 1 ? 's' : ''}, {sqft.toLocaleString()} sqft
                  </div>
                  
                  {/* Location - Smallest, Lighter */}
                  <div className="text-xs">
                    {location}
                  </div>
                </div>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>
    </div>
  );
};

export default GooglePropertyMap;
