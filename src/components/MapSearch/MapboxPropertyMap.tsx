"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MapboxMap from 'react-map-gl/mapbox';
import { Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { useRouter } from 'next/navigation';
import { Plus, Minus, X } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { getPropertyUrl } from '@/lib/utils/propertyUrl';
import { getMapboxThemeStyle, type MapboxTheme, activeMapboxTheme } from '@/lib/constants/mapboxThemes';
import { MapFilterPanel } from './MapFilterPanel';
import { FilterComponentProps } from '@/lib/types/filters';
import { LOCATIONS } from '@/lib/types/filters';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { GeoJSONSource } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';

interface MapboxPropertyMapProps {
  properties: PropertyListing[];
  selectedProperty: PropertyListing | null;
  onPropertySelect: (property: PropertyListing | null) => void;
  onBoundsChange: (bounds: {north: number; south: number; east: number; west: number}) => void;
  theme?: MapboxTheme;
  initialCenter?: {lat: number; lng: number};
  initialZoom?: number;
  locationCenter?: {lat: number; lng: number} | null;
  showFilters?: boolean;
  isPreCon?: boolean;
  showPreConStatus?: boolean;
  filters?: FilterComponentProps['filters'];
  handleFilterChange?: FilterComponentProps['handleFilterChange'];
  resetFilters?: FilterComponentProps['resetFilters'];
  communities?: FilterComponentProps['communities'];
  locations?: FilterComponentProps['locations'];
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

// Default center (Toronto area)
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

const MapboxPropertyMap: React.FC<MapboxPropertyMapProps> = ({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  onBoundsChange,
  theme = activeMapboxTheme,
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
  const mapRef = useRef<MapRef>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [popupInfo, setPopupInfo] = useState<{
    property: PropertyListing;
    lngLat: [number, number];
  } | null>(null);
  const [unclusteredProperties, setUnclusteredProperties] = useState<PropertyListing[]>([]);
  const [zoom, setZoom] = useState(initialZoom);
  const isInitialFitRef = useRef<boolean>(false);
  const isProgrammaticUpdateRef = useRef<boolean>(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerIconCacheRef = useRef<Map<string, string>>(new Map());
  const sourceLoadedRef = useRef<boolean>(false);

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Convert properties to GeoJSON format
  const propertiesGeoJSON = useMemo(() => {
    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    return {
      type: 'FeatureCollection' as const,
      features: validProperties.map(property => ({
        type: 'Feature' as const,
        id: property.mlsNumber,
        properties: {
          propertyId: property.mlsNumber,
          price: property.listPrice,
          // Store property data in properties for popup access
          propertyData: JSON.stringify(property)
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [property.map.longitude!, property.map.latitude!]
        }
      }))
    };
  }, [properties]);

  // Update GeoJSON source when properties change
  useEffect(() => {
    if (!mapRef.current || !sourceLoadedRef.current) return;

    const map = mapRef.current.getMap();
    const source = map.getSource('properties') as GeoJSONSource;
    
    if (source) {
      source.setData(propertiesGeoJSON);
    }
  }, [propertiesGeoJSON]);

  // Create marker icon (SVG data URL)
  const createMarkerIcon = useCallback((priceText: string, isSelected: boolean): string => {
    const cacheKey = `${priceText}-${isSelected}`;
    
    if (markerIconCacheRef.current.has(cacheKey)) {
      return markerIconCacheRef.current.get(cacheKey)!;
    }

    const textWidth = priceText.length * 7 + 20;
    const markerWidth = Math.max(60, textWidth);
    const markerHeight = 28;
    const borderRadius = markerHeight / 2;
    
    const svg = `
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
    `;

    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

    // Cache the icon
    if (markerIconCacheRef.current.size > 100) {
      const firstKey = markerIconCacheRef.current.keys().next().value;
      if (firstKey) {
        markerIconCacheRef.current.delete(firstKey);
      }
    }
    markerIconCacheRef.current.set(cacheKey, dataUrl);
    
    return dataUrl;
  }, []);

  // Handle map load and setup native clustering
  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // Add GeoJSON source with clustering enabled
    map.addSource('properties', {
      type: 'geojson',
      generateId: true,
      data: propertiesGeoJSON,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points
    });

    // Add cluster circles layer
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'properties',
      filter: ['has', 'point_count'],
      paint: {
        // Use step expressions for different cluster sizes
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#1AC0EB', // Default color for small clusters
          10,
          '#1AC0EB', // Same color for medium clusters
          100,
          '#1AC0EB'  // Same color for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,  // Small clusters
          10,
          30,  // Medium clusters
          100,
          40   // Large clusters
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-emissive-strength': 1
      }
    });

    // Add cluster count labels
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'properties',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add unclustered points layer (hidden - we'll use React Markers instead)
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'properties',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-opacity': 0 // Hide native circles, we'll use React Markers
      }
    });

    // Handle cluster clicks - zoom to expansion zoom
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      if (features.length === 0 || !features[0]) return;
      
      const firstFeature = features[0];
      if (!firstFeature || !firstFeature.properties) return;
      
      const clusterId = firstFeature.properties.cluster_id;
      const source = map.getSource('properties') as GeoJSONSource | null;
      
      if (!source) return;
      
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === null || zoom === undefined) return;

        const geometry = firstFeature.geometry;
        if (geometry.type === 'Point') {
          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom
          });
        }
      });
    });

    // Handle unclustered point clicks - show popup (fallback if React Marker doesn't catch it)
    map.on('click', 'unclustered-point', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });
      if (features.length === 0 || !features[0]) return;
      
      const geometry = features[0].geometry;
      if (geometry.type !== 'Point') return;
      
      const coordinates = [...geometry.coordinates] as [number, number];
      const propertyData = JSON.parse(features[0].properties?.propertyData || '{}');
      
      if (propertyData && propertyData.mlsNumber) {
        const property = properties.find(p => p.mlsNumber === propertyData.mlsNumber);
        if (property) {
          onPropertySelect(property);
          setPopupInfo({
            property,
            lngLat: coordinates
          });
        }
      }
    });

    // Change cursor on hover
    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'unclustered-point', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
    });

    sourceLoadedRef.current = true;

    // Set initial center and zoom
    if (locationCenter) {
      mapRef.current.flyTo({
        center: [locationCenter.lng, locationCenter.lat],
        zoom: 12,
        duration: 0
      });
    } else if (initialCenter) {
      mapRef.current.flyTo({
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        duration: 0
      });
    }

    // Trigger initial bounds change
    const mapBounds = map.getBounds();
    if (mapBounds) {
      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      onBoundsChange({
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng
      });
    }
  }, [initialCenter, initialZoom, locationCenter, onBoundsChange, properties, propertiesGeoJSON, onPropertySelect]);

  // Update unclustered properties when map moves or properties change
  useEffect(() => {
    if (!mapRef.current || !sourceLoadedRef.current) return;

    const map = mapRef.current.getMap();
    const source = map.getSource('properties') as GeoJSONSource;
    
    if (!source) return;

    // Query source for unclustered features in current viewport
    const updateUnclustered = () => {
      try {
        const bounds = map.getBounds();
        if (!bounds) return;
        
        // Query all rendered features in the viewport
        const unclusteredFeatures = map.queryRenderedFeatures(
          [
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()]
          ],
          {
            layers: ['unclustered-point']
          }
        );

        const unclustered = unclusteredFeatures
          .map(feature => {
            try {
              const propertyData = JSON.parse(feature.properties?.propertyData || '{}');
              return properties.find(p => p.mlsNumber === propertyData.mlsNumber);
            } catch {
              return null;
            }
          })
          .filter((p): p is PropertyListing => p !== null && p !== undefined);

        setUnclusteredProperties(unclustered);
      } catch (error) {
        // Ignore errors during query
      }
    };

    // Update on move
    map.on('moveend', updateUnclustered);
    map.on('zoomend', updateUnclustered);
    
    // Initial update
    updateUnclustered();

    return () => {
      map.off('moveend', updateUnclustered);
      map.off('zoomend', updateUnclustered);
    };
  }, [properties, sourceLoadedRef]);

  // Handle map move/zoom
  const onMove = useCallback(() => {
    if (!mapRef.current || isProgrammaticUpdateRef.current) return;

    const map = mapRef.current.getMap();
    const mapBounds = map.getBounds();
    const currentZoom = map.getZoom();

    setZoom(currentZoom);

    if (mapBounds) {
      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();

      // Throttle bounds change callback
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
      
      boundsChangeTimeoutRef.current = setTimeout(() => {
        onBoundsChange({
          north: ne.lat,
          south: sw.lat,
          east: ne.lng,
          west: sw.lng
        });
      }, 150);
    }
  }, [onBoundsChange]);

  // Center map on selected property
  useEffect(() => {
    if (!mapRef.current || !selectedProperty || !selectedProperty.map.latitude || !selectedProperty.map.longitude) return;

    isProgrammaticUpdateRef.current = true;
    const position = {
      lat: selectedProperty.map.latitude!,
      lng: selectedProperty.map.longitude!
    };

    mapRef.current.flyTo({
      center: [position.lng, position.lat],
      zoom: Math.max(mapRef.current.getZoom() || 10, 12),
      duration: 500
    });

    // Show popup for selected property
    setPopupInfo({
      property: selectedProperty,
      lngLat: [position.lng, position.lat]
    });

    requestAnimationFrame(() => {
      isProgrammaticUpdateRef.current = false;
    });
  }, [selectedProperty]);

  // Update map center when location filter changes
  useEffect(() => {
    if (!locationCenter || !mapRef.current) return;

    isProgrammaticUpdateRef.current = true;
    mapRef.current.flyTo({
      center: [locationCenter.lng, locationCenter.lat],
      zoom: 12,
      duration: 500
    });

    requestAnimationFrame(() => {
      isProgrammaticUpdateRef.current = false;
    });
  }, [locationCenter]);

  // Fit map to show all properties
  useEffect(() => {
    if (!mapRef.current || properties.length === 0 || initialCenter || locationCenter) return;

    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0 || isInitialFitRef.current) return;

    const coordinates = validProperties.map(property => [
      property.map.longitude!,
      property.map.latitude!
    ] as [number, number]);

    if (coordinates.length > 0) {
      isProgrammaticUpdateRef.current = true;
      // Create bounds from coordinates using the map's LngLatBounds
      const map = mapRef.current.getMap();
      const bounds = new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]);
      coordinates.forEach(coord => {
        bounds.extend(coord as [number, number]);
      });
      
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        duration: 0
      });

      requestAnimationFrame(() => {
        isProgrammaticUpdateRef.current = false;
      });

      isInitialFitRef.current = true;
    }
  }, [properties, initialCenter, locationCenter]);

  // Resize map when container size changes (e.g., when divider is dragged)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Clear any pending resize
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        // Trigger map resize when container size changes
        requestAnimationFrame(() => {
          if (mapRef.current) {
            const map = mapRef.current.getMap();
            try {
              // Force resize - this tells Mapbox to recalculate its dimensions
              map.resize();
            } catch (error) {
              console.warn('Map resize error:', error);
            }
          }
        });
      }, 150);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      // Check if size actually changed
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          handleResize();
          break;
        }
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  // Handle zoom in
  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.zoomTo(Math.min(currentZoom + 1, 20), { duration: 300 });
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.zoomTo(Math.max(currentZoom - 1, 1), { duration: 300 });
    }
  };

  // Cleanup map layers on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        try {
          // Remove layers
          if (map.getLayer('clusters')) map.removeLayer('clusters');
          if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
          if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
          // Remove source
          if (map.getSource('properties')) map.removeSource('properties');
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  // Handle marker click
  const handleMarkerClick = (property: PropertyListing, lngLat: [number, number]) => {
    onPropertySelect(property);
    setPopupInfo({
      property,
      lngLat
    });
  };

  // Handle map click to deselect
  const handleMapClick = () => {
    onPropertySelect(null);
    setPopupInfo(null);
  };


  const themeStyle = useMemo(() => getMapboxThemeStyle(theme), [theme]);

  if (!mapboxAccessToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Mapbox access token is not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="relative w-full h-full" style={{ minWidth: 0, minHeight: 0 }}>
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

      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={mapboxAccessToken}
        initialViewState={{
          longitude: initialCenter?.lng || defaultCenter.lng,
          latitude: initialCenter?.lat || defaultCenter.lat,
          zoom: initialZoom
        }}
        style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}
        mapStyle={themeStyle}
        onLoad={onMapLoad}
        onMove={onMove}
        onClick={handleMapClick}
        interactiveLayerIds={['clusters', 'unclustered-point']}
      >
        {/* Render custom price markers for unclustered properties */}
        {unclusteredProperties.map((property) => {
          if (!property.map.latitude || !property.map.longitude) return null;

          const priceText = `$${(property.listPrice / 1000).toFixed(0)}K`;
          const isSelected = selectedProperty?.mlsNumber === property.mlsNumber;
          const iconUrl = createMarkerIcon(priceText, isSelected);

          return (
            <Marker
              key={`marker-${property.mlsNumber}`}
              longitude={property.map.longitude}
              latitude={property.map.latitude}
              anchor="center"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkerClick(property, [property.map.longitude!, property.map.latitude!]);
                }}
                className="cursor-pointer"
                style={{
                  backgroundImage: `url(${iconUrl})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  width: 'auto',
                  height: '28px',
                  minWidth: '60px'
                }}
              />
            </Marker>
          );
        })}

        {/* Popup for selected property */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lngLat[0]}
            latitude={popupInfo.lngLat[1]}
            anchor="bottom"
            onClose={() => {
              setPopupInfo(null);
              onPropertySelect(null);
            }}
            closeButton={false}
            className="mapbox-popup"
          >
            <div className="property-info-window bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ width: '220px', padding: '0', margin: '0' }}>
              {/* Close Button */}
              <button
                onClick={() => {
                  setPopupInfo(null);
                  onPropertySelect(null);
                }}
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
                  src={popupInfo.property.images.imageUrl} 
                  alt={popupInfo.property.details.propertyType || 'Property'}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '12px 12px 0 0' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/p1.jpg';
                  }}
                />
              </div>
              
              {/* Content Section */}
              <div className="p-3 space-y-1">
                {/* Price */}
                <div className="text-base font-bold leading-tight">
                  {popupInfo.property.type === 'Lease' 
                    ? `$${popupInfo.property.listPrice.toLocaleString()} / month`
                    : `$${popupInfo.property.listPrice.toLocaleString()}`}
                </div>
                
                {/* Property Metrics */}
                <div className="text-xs text-primary">
                  {popupInfo.property.details.numBedrooms || 0} Bed{(popupInfo.property.details.numBedrooms || 0) !== 1 ? 's' : ''}, {popupInfo.property.details.numBathrooms || 0} Bath{(popupInfo.property.details.numBathrooms || 0) !== 1 ? 's' : ''}, {typeof popupInfo.property.details.sqft === 'number' ? popupInfo.property.details.sqft.toLocaleString() : (typeof popupInfo.property.details.sqft === 'string' ? parseInt(popupInfo.property.details.sqft.replace(/,/g, '')).toLocaleString() : '0')} sqft
                </div>
                
                {/* Location */}
                <div className="text-xs">
                  {[popupInfo.property.address.streetNumber, popupInfo.property.address.streetName, popupInfo.property.address.streetSuffix].filter(Boolean).join(' ')}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </MapboxMap>
    </div>
  );
};

export default MapboxPropertyMap;
