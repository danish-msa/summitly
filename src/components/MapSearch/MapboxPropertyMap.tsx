"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MapboxMap from 'react-map-gl/mapbox';
import { Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import Supercluster from 'supercluster';
import { useRouter } from 'next/navigation';
import { Plus, Minus, X } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { getPropertyUrl } from '@/lib/utils/propertyUrl';
import { getMapboxThemeStyle, type MapboxTheme, activeMapboxTheme } from '@/lib/constants/mapboxThemes';
import { MapFilterPanel } from './MapFilterPanel';
import { FilterComponentProps } from '@/lib/types/filters';
import { LOCATIONS } from '@/lib/types/filters';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const clustererRef = useRef<Supercluster | null>(null);
  const markersRef = useRef<Map<string, PropertyListing>>(new Map());
  const router = useRouter();
  const [popupInfo, setPopupInfo] = useState<{
    property: PropertyListing;
    lngLat: [number, number];
  } | null>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const isInitialFitRef = useRef<boolean>(false);
  const isProgrammaticUpdateRef = useRef<boolean>(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerIconCacheRef = useRef<Map<string, string>>(new Map());

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Initialize clusterer
  const initializeClusterer = useCallback(() => {
    const validProperties = properties.filter(
      p => p.map.latitude && p.map.longitude
    );

    if (validProperties.length === 0) {
      clustererRef.current = null;
      setClusters([]);
      return;
    }

    // Create points for clustering
    const points = validProperties.map(property => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        propertyId: property.mlsNumber,
        property: property
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [property.map.longitude!, property.map.latitude!]
      }
    }));

    // Initialize Supercluster
    const clusterer = new Supercluster({
      radius: 50,
      maxZoom: 15,
      minZoom: 0,
      minPoints: 2
    });

    clusterer.load(points);
    clustererRef.current = clusterer;

    // Update clusters based on current bounds and zoom
    if (bounds) {
      const newClusters = clusterer.getClusters(bounds, Math.floor(zoom));
      setClusters(newClusters);
    }
  }, [properties, bounds, zoom]);

  // Update clusters when map moves
  useEffect(() => {
    if (clustererRef.current && bounds) {
      const newClusters = clustererRef.current.getClusters(bounds, Math.floor(zoom));
      setClusters(newClusters);
    }
  }, [bounds, zoom]);

  // Initialize clusterer when properties change
  useEffect(() => {
    initializeClusterer();
  }, [initializeClusterer]);

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

  // Handle map load
  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;

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
    const map = mapRef.current.getMap();
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
  }, [initialCenter, initialZoom, locationCenter, onBoundsChange]);

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
      const newBounds: [number, number, number, number] = [
        sw.lng, // west
        sw.lat, // south
        ne.lng, // east
        ne.lat  // north
      ];
      setBounds(newBounds);

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
      mapRef.current.fitBounds(coordinates as [number, number][], {
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

  // Handle cluster click
  const handleClusterClick = (cluster: any) => {
    if (!mapRef.current) return;

    const expansionZoom = Math.min(
      (clustererRef.current?.getClusterExpansionZoom(cluster.id) || 0) + 1,
      20
    );

    mapRef.current.flyTo({
      center: cluster.geometry.coordinates as [number, number],
      zoom: expansionZoom,
      duration: 500
    });
  };

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

  const handleViewProperty = (property: PropertyListing) => {
    router.push(getPropertyUrl(property));
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
        interactiveLayerIds={[]}
      >
        {/* Render clusters and markers */}
        {clusters.map((cluster) => {
          const { cluster: isCluster, point_count } = cluster.properties;
          const [longitude, latitude] = cluster.geometry.coordinates;

          if (isCluster) {
            // Render cluster marker
            const size = point_count < 10 ? 40 : point_count < 100 ? 50 : 60;
            const fontSize = point_count < 10 ? '12px' : point_count < 100 ? '14px' : '16px';
            const displayCount = point_count >= 1000 ? `${(point_count / 1000).toFixed(0)}K` : point_count.toString();
            const secondaryColor = '#1AC0EB';

            return (
              <Marker
                key={`cluster-${cluster.id}`}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(cluster);
                  }}
                  className="cursor-pointer"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: secondaryColor,
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: fontSize,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {displayCount}
                </div>
              </Marker>
            );
          } else {
            // Render individual property marker
            const property = cluster.properties.property as PropertyListing;
            if (!property) return null;

            const priceText = `$${(property.listPrice / 1000).toFixed(0)}K`;
            const isSelected = selectedProperty?.mlsNumber === property.mlsNumber;
            const iconUrl = createMarkerIcon(priceText, isSelected);

            return (
              <Marker
                key={`marker-${property.mlsNumber}`}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkerClick(property, [longitude, latitude]);
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
          }
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
