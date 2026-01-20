"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useRouter } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
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
  // Debug: Log when locationCenter prop changes
  useEffect(() => {
    console.log('[GooglePropertyMap] Component received locationCenter prop:', locationCenter);
  }, [locationCenter]);
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

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Initialize marker clusterer with custom secondary color
  const initializeClusterer = useCallback((map: google.maps.Map) => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Secondary color: #1AC0EB
    const secondaryColor = '#1AC0EB';
    
    // Custom renderer for clusters with secondary color
    const renderer = {
      render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
        // Calculate cluster size based on count
        const size = count < 10 ? 40 : count < 100 ? 50 : 60;
        const fontSize = count < 10 ? '12px' : count < 100 ? '14px' : '16px';
        
        // Create SVG icon with secondary color
        const svg = `
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${secondaryColor}" stroke="white" stroke-width="2"/>
            <text x="${size/2}" y="${size/2 + (size * 0.15)}" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif">${count}</text>
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

    clustererRef.current = new MarkerClusterer({
      map,
      markers: markersRef.current,
      renderer
    });
  }, []);

  // Create property markers
  const createMarkers = useCallback((map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0) return;

    // Create markers for each property
    validProperties.forEach(property => {
      if (!property.map.latitude || !property.map.longitude) return;

      // Format price for display
      const priceText = `$${(property.listPrice / 1000).toFixed(0)}K`;
      
      // Calculate width based on price text length
      const textWidth = priceText.length * 7 + 20; // Approximate width calculation
      const markerWidth = Math.max(60, textWidth);
      const markerHeight = 28;
      
      const marker = new google.maps.Marker({
        position: {
          lat: property.map.latitude,
          lng: property.map.longitude
        },
        map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="${markerWidth}" height="${markerHeight}" viewBox="0 0 ${markerWidth} ${markerHeight}" xmlns="http://www.w3.org/2000/svg">
              <rect 
                x="0" 
                y="0" 
                width="${markerWidth}" 
                height="${markerHeight}" 
                rx="6" 
                ry="6" 
                fill="white" 
                stroke="${selectedProperty?.mlsNumber === property.mlsNumber ? '#e74c3c' : '#e5e7eb'}" 
                stroke-width="${selectedProperty?.mlsNumber === property.mlsNumber ? '2' : '1'}"
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
        },
        title: `${property.details.propertyType} - $${property.listPrice.toLocaleString()}`
      });

      // Add click event to marker
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        // Stop event propagation to prevent map click handler from firing
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
    });

    // Initialize clusterer with new markers
    initializeClusterer(map);
  }, [properties, selectedProperty, onPropertySelect, initializeClusterer]);

  // Handle map click to deselect property (like onTap in Flutter)
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    // Only deselect if clicking directly on the map (not on a marker)
    // Markers will stop propagation in their click handlers
    if (e.latLng) {
      onPropertySelect(null);
      setInfoWindow(null);
    }
  }, [onPropertySelect]);


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
    
    // Trigger initial bounds change after a short delay
    setTimeout(() => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng()
        });
      }
    }, 100);
    
    // Add bounds change listener
    map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng()
        });
      }
    });

    // Add map click listener to deselect property
    map.addListener('click', handleMapClick);

    // Create initial markers
    createMarkers(map);
  }, [createMarkers, onBoundsChange, handleMapClick, initialCenter, initialZoom]);

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
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 10, 12));

    // Show info window for selected property
    setInfoWindow({
      property: selectedProperty,
      position: new google.maps.LatLng(position.lat, position.lng)
    });

    // Reset flag after a short delay
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 100);
  }, [selectedProperty]);

  // Store locationCenter in a ref to access it in onMapLoad
  const locationCenterRef = useRef(locationCenter);
  useEffect(() => {
    locationCenterRef.current = locationCenter;
  }, [locationCenter]);

  // Update map center when location filter changes
  useEffect(() => {
    console.log('[GooglePropertyMap] locationCenter effect triggered, locationCenter:', locationCenter);
    console.log('[GooglePropertyMap] mapRef.current:', !!mapRef.current);
    
    if (!locationCenter) {
      console.log('[GooglePropertyMap] No location center provided, skipping update');
      return;
    }

    // Function to update map center
    const updateMapCenter = () => {
      if (!mapRef.current) {
        console.log('[GooglePropertyMap] Map not ready in updateMapCenter');
        return false;
      }

      console.log('[GooglePropertyMap] Updating map center to:', locationCenter);
      isProgrammaticUpdateRef.current = true;
      
      // Always update the map center when locationCenter changes
      const newPosition = new google.maps.LatLng(locationCenter.lat, locationCenter.lng);
      
      // Use setCenter for immediate update
      mapRef.current.setCenter(newPosition);
      mapRef.current.setZoom(12);
      
      // Also use panTo for smooth transition
      setTimeout(() => {
        if (mapRef.current && locationCenter) {
          mapRef.current.panTo(newPosition);
          console.log('[GooglePropertyMap] Map center updated and zoom set to 12');
        }
      }, 100);

      // Reset flag after a delay
      setTimeout(() => {
        isProgrammaticUpdateRef.current = false;
      }, 500);
      
      return true;
    };

    // Try to update immediately
    if (!updateMapCenter()) {
      // If map isn't ready, retry after a delay
      console.log('[GooglePropertyMap] Map not ready yet, will retry when map loads');
      const retryTimeout = setTimeout(() => {
        if (mapRef.current && locationCenter) {
          console.log('[GooglePropertyMap] Retrying map center update after map load');
          updateMapCenter();
        }
      }, 500);
      return () => clearTimeout(retryTimeout);
    }
  }, [locationCenter]);

  // Fit map to show all properties (only if no initial center is provided)
  useEffect(() => {
    if (!mapRef.current || properties.length === 0 || initialCenter) return;

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

      // Reset flag after fitBounds completes
      setTimeout(() => {
        isProgrammaticUpdateRef.current = false;
      }, 200);

      isInitialFitRef.current = true;
    }
  }, [properties, initialCenter]);

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
        {infoWindow && (
          <InfoWindow
            position={infoWindow.position}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="property-info-window" style={{ width: '280px', padding: '0' }}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={infoWindow.property.images.imageUrl} 
                  alt={infoWindow.property.details.propertyType}
                  style={{
                    width: '100%',
                    height: '160px',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">
                    {infoWindow.property.details.propertyType} in {infoWindow.property.address.city}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {infoWindow.property.address.location}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-primary">
                      ${infoWindow.property.listPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {infoWindow.property.details.numBedrooms} bd | {infoWindow.property.details.numBathrooms} ba | {infoWindow.property.details.sqft} sqft
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewProperty(infoWindow.property)}
                    className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default GooglePropertyMap;
