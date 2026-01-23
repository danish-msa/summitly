"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MapboxMap from 'react-map-gl/mapbox';
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
  const [zoom, setZoom] = useState(initialZoom);
  const isInitialFitRef = useRef<boolean>(false);
  const isProgrammaticUpdateRef = useRef<boolean>(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const sourceLoadedRef = useRef<boolean>(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Create marker image for Mapbox (returns HTMLImageElement) - using SVG for reliability
  const createMarkerImage = useCallback((priceText: string, isSelected: boolean, map: mapboxgl.Map): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const cacheKey = `${priceText}-${isSelected}`;
      
      if (markerImageCacheRef.current.has(cacheKey)) {
        resolve(markerImageCacheRef.current.get(cacheKey)!);
        return;
      }

      const textWidth = priceText.length * 7 + 20;
      const markerWidth = Math.max(60, textWidth);
      const markerHeight = 28;
      const borderRadius = markerHeight / 2;
      const strokeColor = isSelected ? '#e74c3c' : '#e5e7eb';
      const strokeWidth = isSelected ? '2' : '1';
      
      // Create SVG as data URL (more reliable than canvas)
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
            stroke="${strokeColor}" 
            stroke-width="${strokeWidth}"
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
      
      const img = new Image();
      img.onload = () => {
        // Cache the image
        if (markerImageCacheRef.current.size > 100) {
          const firstKey = markerImageCacheRef.current.keys().next().value;
          if (firstKey) {
            markerImageCacheRef.current.delete(firstKey);
          }
        }
        markerImageCacheRef.current.set(cacheKey, img);
        resolve(img);
      };
      img.onerror = () => {
        // Fallback to simple image if SVG fails
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjI4IiByeD0iMTQiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNlNWU3ZWIiLz48L3N2Zz4=';
      };
      img.src = dataUrl;
    });
  }, []);

  // Helper function to create popup HTML (used by native Mapbox popup)
  const createPopupHTML = useCallback((property: PropertyListing): string => {
    const price = property.type === 'Lease' 
      ? `$${property.listPrice.toLocaleString()} / month`
      : `$${property.listPrice.toLocaleString()}`;
    
    const beds = property.details.numBedrooms || 0;
    const baths = property.details.numBathrooms || 0;
    const sqft = typeof property.details.sqft === 'number' 
      ? property.details.sqft.toLocaleString() 
      : (typeof property.details.sqft === 'string' 
        ? parseInt(property.details.sqft.replace(/,/g, '')).toLocaleString() 
        : '0');
    
    const address = [
      property.address.streetNumber,
      property.address.streetName,
      property.address.streetSuffix
    ].filter(Boolean).join(' ');

    return `
      <div class="property-info-window bg-white rounded-xl shadow-lg overflow-hidden relative" style="width: 220px; padding: 0; margin: 0;">
        <button
          onclick="this.closest('.mapboxgl-popup-content').querySelector('.close-popup')?.click()"
          class="absolute top-2 right-2 z-10 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
          aria-label="Close"
          title="Close"
        >
          <svg class="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div class="relative w-full h-20 overflow-hidden rounded-t-xl">
          <img 
            src="${property.images.imageUrl}" 
            alt="${property.details.propertyType || 'Property'}"
            class="w-full h-full object-cover"
            style="border-radius: 12px 12px 0 0"
            onerror="this.src='/images/p1.jpg'"
          />
        </div>
        <div class="p-3 space-y-1">
          <div class="text-base font-bold leading-tight">${price}</div>
          <div class="text-xs text-primary">${beds} Bed${beds !== 1 ? 's' : ''}, ${baths} Bath${baths !== 1 ? 's' : ''}, ${sqft} sqft</div>
          <div class="text-xs">${address}</div>
        </div>
      </div>
    `;
  }, []);

  // Convert properties to GeoJSON format (Mapbox native format)
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
          priceText: `$${(property.listPrice / 1000).toFixed(0)}K`,
          // Store minimal property data for popup
          propertyData: JSON.stringify({
            mlsNumber: property.mlsNumber,
            listPrice: property.listPrice,
            type: property.type,
            details: {
              propertyType: property.details.propertyType,
              numBedrooms: property.details.numBedrooms,
              numBathrooms: property.details.numBathrooms,
              sqft: property.details.sqft
            },
            address: {
              streetNumber: property.address.streetNumber,
              streetName: property.address.streetName,
              streetSuffix: property.address.streetSuffix
            },
            images: {
              imageUrl: property.images.imageUrl
            }
          })
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [property.map.longitude!, property.map.latitude!]
        }
      }))
    };
  }, [properties]);

  // Update GeoJSON source when properties change (Mapbox native method)
  useEffect(() => {
    if (!mapRef.current || !sourceLoadedRef.current) return;

    const map = mapRef.current.getMap();
    const source = map.getSource('properties') as GeoJSONSource | null;
    
    if (source) {
      // Update source data (Mapbox native method)
      source.setData(propertiesGeoJSON);
      
      // Reload marker images if new properties are added
      const loadNewMarkerImages = async () => {
        const uniquePrices = new Set<string>();
        properties.forEach(prop => {
          if (prop.map.latitude && prop.map.longitude) {
            const priceText = `$${(prop.listPrice / 1000).toFixed(0)}K`;
            uniquePrices.add(priceText);
          }
        });

        const loadPromises: Promise<void>[] = [];
        uniquePrices.forEach(priceText => {
          if (!map.hasImage(`marker-${priceText}`)) {
            loadPromises.push(
              createMarkerImage(priceText, false, map).then(img => {
                map.addImage(`marker-${priceText}`, img);
              })
            );
          }
          if (!map.hasImage(`marker-${priceText}-selected`)) {
            loadPromises.push(
              createMarkerImage(priceText, true, map).then(img => {
                map.addImage(`marker-${priceText}-selected`, img);
              })
            );
          }
        });

        await Promise.all(loadPromises);
      };

      loadNewMarkerImages().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertiesGeoJSON, properties]);


  // Handle map load and setup native clustering (following Mapbox official docs)
  const onMapLoad = useCallback(async () => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // Add GeoJSON source with clustering enabled (Mapbox native)
    map.addSource('properties', {
      type: 'geojson',
      generateId: true,
      data: propertiesGeoJSON,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    // Add cluster circles layer (Mapbox native)
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'properties',
      filter: ['has', 'point_count'],
      paint: {
        // Use step expressions for different cluster sizes (Mapbox recommended)
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#1AC0EB', // Small clusters (< 10)
          10,
          '#1AC0EB', // Medium clusters (10-100)
          100,
          '#1AC0EB'  // Large clusters (>= 100)
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

    // Add cluster count labels (Mapbox native)
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

    // Load custom marker images for unclustered points
    const loadMarkerImages = async () => {
      const uniquePrices = new Set<string>();
      properties.forEach(prop => {
        if (prop.map.latitude && prop.map.longitude) {
          const priceText = `$${(prop.listPrice / 1000).toFixed(0)}K`;
          uniquePrices.add(priceText);
        }
      });

      // Load images for all unique prices (selected and unselected)
      const loadPromises: Promise<void>[] = [];
      uniquePrices.forEach(priceText => {
        loadPromises.push(
          createMarkerImage(priceText, false, map).then(img => {
            if (!map.hasImage(`marker-${priceText}`)) {
              map.addImage(`marker-${priceText}`, img);
            }
          })
        );
        loadPromises.push(
          createMarkerImage(priceText, true, map).then(img => {
            if (!map.hasImage(`marker-${priceText}-selected`)) {
              map.addImage(`marker-${priceText}-selected`, img);
            }
          })
        );
      });

      await Promise.all(loadPromises);

      // Add unclustered points layer with custom images (Mapbox native)
      // For now, use simple circles - we'll enhance with custom images after they load
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-opacity': 0 // Hidden initially, will be replaced with symbol layer
        }
      });
      
      // After images load, replace circle layer with symbol layer
      setTimeout(() => {
        if (map.getLayer('unclustered-point')) {
          map.removeLayer('unclustered-point');
        }
        
        map.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'properties',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': ['concat', 'marker-', ['get', 'priceText']],
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
      }, 500); // Small delay to ensure images are loaded
    };

    await loadMarkerImages();

    // Handle cluster clicks - zoom to expansion zoom (Mapbox native method)
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
      
      // Use Mapbox's native getClusterExpansionZoom (per official docs)
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

    // Handle unclustered point clicks - show popup (Mapbox native)
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
          
          // Close existing popup
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
          
          // Create native Mapbox popup (per official docs)
          const popup = new mapboxgl.Popup({ 
            closeOnClick: true, 
            closeButton: true,
            className: 'mapbox-popup'
          })
            .setLngLat(coordinates)
            .setHTML(createPopupHTML(property))
            .addTo(map);
          
          popupRef.current = popup;
          
          // Also update state for React component tracking
          setPopupInfo({
            property,
            lngLat: coordinates
          });
          
          // Handle popup close
          popup.on('close', () => {
            popupRef.current = null;
            setPopupInfo(null);
            onPropertySelect(null);
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
  }, [initialCenter, initialZoom, locationCenter, onBoundsChange, properties, propertiesGeoJSON, onPropertySelect, selectedProperty, createMarkerImage]);


  // Update marker images when selected property changes (Mapbox native)
  useEffect(() => {
    if (!mapRef.current || !sourceLoadedRef.current) return;

    const map = mapRef.current.getMap();
    
    // Update unclustered-point layer icon-image to show selected state
    if (map.getLayer('unclustered-point')) {
      const selectedId = selectedProperty?.mlsNumber || '';
      
      // Update layout property to use selected image for selected property
      map.setLayoutProperty('unclustered-point', 'icon-image', [
        'case',
        ['==', ['get', 'propertyId'], selectedId],
        ['concat', 'marker-', ['get', 'priceText'], '-selected'],
        ['concat', 'marker-', ['get', 'priceText']]
      ]);
    }
  }, [selectedProperty, sourceLoadedRef]);

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

    // Show native Mapbox popup for selected property
    if (popupRef.current) {
      popupRef.current.remove();
    }
    
    const popup = new mapboxgl.Popup({ 
      closeOnClick: true, 
      closeButton: true,
      className: 'mapbox-popup'
    })
      .setLngLat([position.lng, position.lat])
      .setHTML(createPopupHTML(selectedProperty))
      .addTo(mapRef.current.getMap());
    
    popupRef.current = popup;
    
    popup.on('close', () => {
      popupRef.current = null;
      setPopupInfo(null);
      onPropertySelect(null);
    });
    
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

  // Handle map click to deselect (close native popup)
  const handleMapClick = () => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
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
        {/* All markers and popups are now handled by native Mapbox layers and popups */}
        {/* No React Markers or Popups needed - everything is native Mapbox */}
      </MapboxMap>
    </div>
  );
};

export default MapboxPropertyMap;
