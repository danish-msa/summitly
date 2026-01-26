"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MapboxMap from 'react-map-gl/mapbox';
import { Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { useRouter } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { getMapboxThemeStyle, type MapboxTheme, activeMapboxTheme } from '@/lib/constants/mapboxThemes';
import { MapFilterPanel } from './MapFilterPanel';
import { FilterComponentProps } from '@/lib/types/filters';
import { LOCATIONS } from '@/lib/types/filters';
import { RepliersAPI, type Cluster, type MapBounds } from '@/lib/api/repliers';
import { formatMapBounds } from '@/lib/api/repliers/services/listings';
import { getPropertyUrl } from '@/lib/utils/propertyUrl';
import { useMapVisibleProperties, getGlobalCallback } from './MapVisiblePropertiesContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { GeoJSONSource } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';

interface MapboxPropertyMapProps {
  properties?: PropertyListing[]; // Optional - will be fetched via clusters
  selectedProperty: PropertyListing | null;
  onPropertySelect: (property: PropertyListing | null) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  onVisiblePropertiesChange?: (properties: PropertyListing[]) => void; // Callback for visible properties in map view
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
  properties = [],
  selectedProperty, 
  onPropertySelect,
  onBoundsChange,
  onVisiblePropertiesChange,
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
  // Debug: Log received callback prop
  useEffect(() => {
    console.log('🔍 [MapboxPropertyMap] Component received onVisiblePropertiesChange prop:', {
      type: typeof onVisiblePropertiesChange,
      value: onVisiblePropertiesChange,
      isFunction: typeof onVisiblePropertiesChange === 'function',
      isUndefined: onVisiblePropertiesChange === undefined,
      isNull: onVisiblePropertiesChange === null,
    });
  }, [onVisiblePropertiesChange]);
  
  const mapRef = useRef<MapRef>(null);
  
  // Get callback from context (primary method due to dynamic import prop issues)
  const contextCallback = useMapVisibleProperties();
  
  // Store callback in ref to ensure it's always available
  const onVisiblePropertiesChangeRef = useRef<((properties: PropertyListing[]) => void) | null>(null);
  const lastVisiblePropertiesRef = useRef<PropertyListing[]>([]);
  
  // Update ref when callback changes - check global callback first (most reliable)
  useEffect(() => {
    const globalCallback = getGlobalCallback();
    const callback = globalCallback || contextCallback.onVisiblePropertiesChange || onVisiblePropertiesChange;
    onVisiblePropertiesChangeRef.current = callback || null;
    console.log('🔍 [MapboxPropertyMap] Component mounted/updated, callback sources:', {
      propType: typeof onVisiblePropertiesChange,
      propValue: onVisiblePropertiesChange,
      globalCallbackValue: globalCallback,
      globalCallbackType: typeof globalCallback,
      contextCallbackValue: contextCallback.onVisiblePropertiesChange,
      contextCallbackType: typeof contextCallback.onVisiblePropertiesChange,
      effectiveCallback: callback,
      effectiveType: typeof callback,
      storedInRef: typeof onVisiblePropertiesChangeRef.current,
      contextObject: contextCallback,
    });
    
    // If callback just became available and we have visible properties, call it immediately
    if (callback && typeof callback === 'function' && lastVisiblePropertiesRef.current.length > 0) {
      console.log('🔄 [MapboxPropertyMap] Callback just became available, calling with existing properties:', lastVisiblePropertiesRef.current.length);
      try {
        callback(lastVisiblePropertiesRef.current);
      } catch (error) {
        console.error('❌ [MapboxPropertyMap] Error calling callback on availability:', error);
      }
    }
  }, [onVisiblePropertiesChange, contextCallback]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [zoom, setZoom] = useState(initialZoom);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [individualListings, setIndividualListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Max zoom threshold - above this, show individual listings instead of clusters
  // At zoom 15 and above, show property tags instead of clusters
  const MAX_ZOOM_FOR_CLUSTERS = 15;
  const isInitialLoadRef = useRef<boolean>(false);
  const isProgrammaticUpdateRef = useRef<boolean>(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const isZoomingRef = useRef<boolean>(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const sourceLoadedRef = useRef<boolean>(false);

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Request throttling - disable requests during user interaction
  const disableRequests = useCallback(() => {
    isUserInteractingRef.current = true;
  }, []);

  const enableRequests = useCallback(() => {
    isUserInteractingRef.current = false;
  }, []);

  // Fetch clusters or individual listings based on zoom level
  const fetchClusters = useCallback(async (bounds: MapBounds, currentZoom: number) => {
    if (isUserInteractingRef.current) {
      console.log('⏸️ [MapboxPropertyMap] Request disabled during user interaction');
      return;
    }

    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce fetch requests
    fetchTimeoutRef.current = setTimeout(async () => {
      if (isUserInteractingRef.current) return;

      setLoading(true);
      try {
        // At max zoom, fetch individual listings instead of clusters
        if (currentZoom >= MAX_ZOOM_FOR_CLUSTERS) {
          console.log('🏠 [MapboxPropertyMap] Max zoom reached, fetching individual listings');
          
          // Build listing parameters with map bounds
          // Use map parameter to filter listings to visible bounds and get accurate counts
          const mapPolygon = formatMapBounds(bounds);
          
          const listingParams: Record<string, unknown> = {
            status: 'A', // Active listings only
            listings: false, // Don't fetch listings, just get counts/statistics
            resultsPerPage: 1000, // Fetch more listings to ensure we have enough in the viewport
            map: mapPolygon, // Add map bounds to filter listings to visible area
          };

          // Add filters if available (skip invalid values like 'all')
          if (filters) {
            if (filters.minPrice) listingParams.minPrice = filters.minPrice;
            if (filters.maxPrice) listingParams.maxPrice = filters.maxPrice;
            if (filters.bedrooms) listingParams.minBedrooms = filters.bedrooms;
            // Only add propertyType if it's not 'all'
            if (filters.propertyType && filters.propertyType !== 'all') {
              listingParams.propertyType = filters.propertyType;
            }
            // Handle listing type - default to 'sale' if not specified or 'all'
            // Convert 'Sale'/'Lease' to lowercase if needed
            if (filters.listingType && filters.listingType !== 'all') {
              const listingType = filters.listingType.toLowerCase();
              if (listingType === 'lease' || listingType === 'sale') {
                listingParams.type = listingType;
              }
            } else {
              // Default to 'sale' (for sale) when no listing type is specified
              // This matches the default behavior in Listings.tsx where listingType defaults to 'sell'
              listingParams.type = 'sale';
            }
          } else {
            // If no filters at all, default to 'sale'
            listingParams.type = 'sale';
          }

          console.log('🗺️ [MapboxPropertyMap] Fetching individual listings:', {
            zoom: currentZoom,
            bounds: `${bounds.west.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.north.toFixed(4)}`,
            params: listingParams,
          });

          // First, get counts/statistics with map bounds (listings=false)
          const countParams: Record<string, unknown> = {
            status: 'A',
            listings: false,
            map: mapPolygon,
          };
          
          const countResult = await RepliersAPI.listings.getFiltered(countParams);
          console.log(`📊 [MapboxPropertyMap] Counts for visible area:`, {
            totalCount: countResult.count,
            statistics: countResult.listings ? 'Available' : 'Not available'
          });
          
          // Now fetch actual listings with map bounds
          listingParams.listings = true; // Enable listings for actual data
          
          const result = await RepliersAPI.listings.getFiltered(listingParams);
          
          console.log(`📦 [MapboxPropertyMap] API returned ${result.listings.length} listings (filtered by map bounds)`);
          console.log(`📐 [MapboxPropertyMap] Bounds: lat ${bounds.south.toFixed(4)} to ${bounds.north.toFixed(4)}, lng ${bounds.west.toFixed(4)} to ${bounds.east.toFixed(4)}`);
          console.log(`📊 [MapboxPropertyMap] Total count in bounds: ${countResult.count || result.count || result.listings.length}`);
          
          // Since we're using map parameter, API should return listings within bounds
          // But we'll still do a light client-side filter for safety
          const filteredListings = result.listings.filter(listing => {
            if (!listing.map?.latitude || !listing.map?.longitude) {
              return false;
            }
            // Light validation - API should have filtered, but verify coordinates are reasonable
            const lat = listing.map.latitude;
            const lng = listing.map.longitude;
            // Add small buffer for edge cases
            const latBuffer = (bounds.north - bounds.south) * 0.05; // 5% buffer
            const lngBuffer = (bounds.east - bounds.west) * 0.05; // 5% buffer
            return lat >= (bounds.south - latBuffer) && lat <= (bounds.north + latBuffer) && 
                   lng >= (bounds.west - lngBuffer) && lng <= (bounds.east + lngBuffer);
          });

          console.log(`✅ [MapboxPropertyMap] Loaded ${filteredListings.length} individual listings at zoom ${currentZoom}`);
          // Clear clusters completely when showing individual listings (strict threshold)
          setClusters([]);
          setIndividualListings(filteredListings);
        } else {
          // Build cluster parameters with map bounds
          // Working endpoint: /listings?cluster=true&clusterLimit=200&listings=false&status=A&map=[[[...]]]
          // The map parameter filters clusters to only those within the visible bounds
          
          // Higher clusterPrecision = MORE clusters with FEWER listings per cluster (more granular)
          // Lower clusterPrecision = FEWER clusters with MORE listings per cluster (less granular)
          // We want clusters to reorganize at EVERY zoom level up to MAX_ZOOM_FOR_CLUSTERS (14)
          // Precision should scale directly with zoom to ensure clusters break down/merge properly:
          // - At zoom 8: precision ~18 (fewer, larger clusters)
          // - At zoom 10: precision ~22 (medium clusters)
          // - At zoom 12: precision ~26 (more granular clusters)
          // - At zoom 13: precision ~28 (very granular)
          // - At zoom 14: precision ~30 (maximum granularity) - capped at 29, last zoom before property tags
          const basePrecision = Math.round(currentZoom);
          // Scale precision: zoom * 2 + 2 ensures good progression
          // API supports precision up to 29, so we cap there
          const clusterPrecision = Math.min(29, Math.max(15, basePrecision * 2 + 2));
          
          console.log(`🎯 [MapboxPropertyMap] Precision calculation: zoom ${currentZoom} -> precision ${clusterPrecision}`);
          
          // Use clusterPrecision directly (no need for finalPrecision adjustment since max zoom is 13)
          const finalPrecision = clusterPrecision;
          
          // Format bounds as GeoJSON polygon for API: [[[lng, lat], [lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
          const mapPolygon = formatMapBounds(bounds);
          
          const clusterParams: Record<string, unknown> = {
            cluster: true,
            listings: false,
            status: 'A', // Active listings only
            clusterLimit: 200, // Limit number of clusters
            clusterPrecision: finalPrecision, // Higher precision = more granular clusters
            map: mapPolygon, // Add map bounds to filter clusters to visible area
          };

          console.log('🗺️ [MapboxPropertyMap] Fetching clusters:', {
            zoom: currentZoom,
            clusterPrecision: finalPrecision,
            bounds: `${bounds.west.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.north.toFixed(4)}`,
            params: clusterParams,
          });

          const result = await RepliersAPI.listings.getClusters(clusterParams);
          
          console.log('📊 [MapboxPropertyMap] Cluster result:', {
            clusterCount: result.clusters?.length || 0,
            listingCount: result.listings?.length || 0,
            totalCount: result.count || 0,
          });

          if (result.clusters) {
            // Verify no duplicate properties across clusters
            // Track MLS numbers to ensure each property appears only once
            const mlsNumbers = new Set<string>();
            let duplicateCount = 0;
            
            result.clusters.forEach((cluster, index) => {
              // Check single listing clusters
              if (cluster.count === 1 && cluster.listing?.mlsNumber) {
                const mlsNum = cluster.listing.mlsNumber;
                if (mlsNumbers.has(mlsNum)) {
                  duplicateCount++;
                  console.warn(`⚠️ [MapboxPropertyMap] Duplicate property found in cluster ${index}: ${mlsNum}`);
                } else {
                  mlsNumbers.add(mlsNum);
                }
              }
              
              // Check clusters with listings array
              if (cluster.listings && Array.isArray(cluster.listings)) {
                cluster.listings.forEach(listing => {
                  if (listing.mlsNumber) {
                    const mlsNum = listing.mlsNumber;
                    if (mlsNumbers.has(mlsNum)) {
                      duplicateCount++;
                      console.warn(`⚠️ [MapboxPropertyMap] Duplicate property found in cluster ${index}: ${mlsNum}`);
                    } else {
                      mlsNumbers.add(mlsNum);
                    }
                  }
                });
              }
            });
            
            if (duplicateCount > 0) {
              console.warn(`⚠️ [MapboxPropertyMap] Found ${duplicateCount} duplicate properties across clusters`);
            } else {
              console.log(`✅ [MapboxPropertyMap] No duplicate properties found - all ${mlsNumbers.size} properties are unique`);
            }
            
            // Also fetch individual listings within bounds for the left panel
            // This ensures we have all properties visible in the map viewport
            const mapPolygon = formatMapBounds(bounds);
            const listingParams: Record<string, unknown> = {
              status: 'A',
              listings: true,
              resultsPerPage: 1000, // Fetch enough listings to cover all clusters
              map: mapPolygon,
            };

            // Add filters if available
            if (filters) {
              if (filters.minPrice) listingParams.minPrice = filters.minPrice;
              if (filters.maxPrice) listingParams.maxPrice = filters.maxPrice;
              if (filters.bedrooms) listingParams.minBedrooms = filters.bedrooms;
              if (filters.propertyType && filters.propertyType !== 'all') {
                listingParams.propertyType = filters.propertyType;
              }
              if (filters.listingType && filters.listingType !== 'all') {
                const listingType = filters.listingType.toLowerCase();
                if (listingType === 'lease' || listingType === 'sale') {
                  listingParams.type = listingType;
                }
              } else {
                listingParams.type = 'sale';
              }
            } else {
              listingParams.type = 'sale';
            }

            console.log('📋 [MapboxPropertyMap] Fetching listings for clusters view:', {
              bounds: `${bounds.west.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.north.toFixed(4)}`,
              params: listingParams,
            });

            try {
              const listingsResult = await RepliersAPI.listings.getFiltered(listingParams);
              
              console.log(`📦 [MapboxPropertyMap] API returned ${listingsResult.listings?.length || 0} listings before filtering`);
              
              // Filter listings to ensure they're within bounds
              const filteredListings = (listingsResult.listings || []).filter(listing => {
                if (!listing.map?.latitude || !listing.map?.longitude) {
                  return false;
                }
                const lat = listing.map.latitude;
                const lng = listing.map.longitude;
                // Add small buffer for edge cases
                const latBuffer = (bounds.north - bounds.south) * 0.05;
                const lngBuffer = (bounds.east - bounds.west) * 0.05;
                return lat >= (bounds.south - latBuffer) && lat <= (bounds.north + latBuffer) && 
                       lng >= (bounds.west - lngBuffer) && lng <= (bounds.east + lngBuffer);
              });

              console.log(`✅ [MapboxPropertyMap] Loaded ${filteredListings.length} listings for clusters view (after filtering)`);
              console.log(`📊 [MapboxPropertyMap] Total cluster count: ${result.count || 0}, Clusters: ${result.clusters?.length || 0}`);
              
              // Store listings for the left panel (these represent all properties in visible clusters)
              setIndividualListings(filteredListings);
              
              // Log if we have clusters but no listings (potential issue)
              if ((result.count || 0) > 0 && filteredListings.length === 0) {
                console.warn('⚠️ [MapboxPropertyMap] WARNING: Clusters show properties exist but no listings were fetched!');
              }
            } catch (listingsError) {
              console.error('❌ [MapboxPropertyMap] Error fetching listings for clusters view:', listingsError);
              console.error('❌ [MapboxPropertyMap] Error details:', {
                message: listingsError instanceof Error ? listingsError.message : String(listingsError),
                stack: listingsError instanceof Error ? listingsError.stack : undefined,
              });
              // Still set clusters even if listings fetch fails
              setIndividualListings([]);
            }
            
            setClusters(result.clusters);
            console.log(`✅ [MapboxPropertyMap] Loaded ${result.clusters.length} clusters at zoom ${currentZoom}`);
          }
        }
      } catch (error) {
        console.error('❌ [MapboxPropertyMap] Error fetching data:', error);
        setClusters([]);
        setIndividualListings([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, [filters]);

  // Store current map bounds for filtering
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);

  // Filter clusters by visible map bounds (client-side filtering)
  const visibleClusters = useMemo(() => {
    if (!currentBounds) return clusters;
    
    // Filter clusters that intersect with visible bounds
    return clusters.filter(cluster => {
      const clusterBounds = cluster.bounds;
      // Check if cluster bounds intersect with visible map bounds
      return !(
        clusterBounds.top_left.longitude > currentBounds.east || // Cluster is east of visible area
        clusterBounds.bottom_right.longitude < currentBounds.west || // Cluster is west of visible area
        clusterBounds.top_left.latitude < currentBounds.south || // Cluster is south of visible area
        clusterBounds.bottom_right.latitude > currentBounds.north // Cluster is north of visible area
      );
    });
  }, [clusters, currentBounds]);

  // Extract all visible properties from clusters and individual listings
  const visibleProperties = useMemo(() => {
    const allProperties: PropertyListing[] = [];

    // When showing clusters (zoom < MAX_ZOOM_FOR_CLUSTERS)
    // We fetch individual listings alongside clusters, so use those for the left panel
    if (zoom < MAX_ZOOM_FOR_CLUSTERS) {
      // Use the individual listings we fetched (they represent all properties in visible clusters)
      individualListings.forEach(listing => {
        if (listing.mlsNumber) {
          allProperties.push(listing);
        }
      });
      
      // Also extract from clusters that have listing/listings data (for completeness)
      visibleClusters.forEach(cluster => {
        // Single listing in cluster
        if (cluster.count === 1 && cluster.listing) {
          const listing = cluster.listing as unknown as PropertyListing;
          if (listing.mlsNumber && !allProperties.find(p => p.mlsNumber === listing.mlsNumber)) {
            allProperties.push(listing);
          }
        }
        // Multiple listings in cluster
        else if (cluster.listings && Array.isArray(cluster.listings)) {
          cluster.listings.forEach(listing => {
            const propertyListing = listing as unknown as PropertyListing;
            if (propertyListing.mlsNumber && !allProperties.find(p => p.mlsNumber === propertyListing.mlsNumber)) {
              allProperties.push(propertyListing);
            }
          });
        }
      });
      
      console.log(`🔍 [MapboxPropertyMap] visibleProperties calculation (clusters view):`, {
        zoom,
        individualListingsCount: individualListings.length,
        visibleClustersCount: visibleClusters.length,
        extractedFromListings: individualListings.length,
        extractedFromClusters: allProperties.length - individualListings.length,
        totalProperties: allProperties.length,
      });
    }
    // When showing individual listings (zoom >= MAX_ZOOM_FOR_CLUSTERS)
    else {
      // Add all individual listings that are visible
      individualListings.forEach(listing => {
        if (listing.mlsNumber) {
          allProperties.push(listing);
        }
      });
      
      console.log(`🔍 [MapboxPropertyMap] visibleProperties calculation (individual listings view):`, {
        zoom,
        individualListingsCount: individualListings.length,
        totalProperties: allProperties.length,
      });
    }

    // Remove duplicates based on MLS number
    const uniqueProperties = Array.from(
      new Map(allProperties.map(prop => [prop.mlsNumber, prop])).values()
    );

    console.log(`✅ [MapboxPropertyMap] Final visibleProperties count: ${uniqueProperties.length} (from ${allProperties.length} total, removed ${allProperties.length - uniqueProperties.length} duplicates)`);

    return uniqueProperties;
  }, [visibleClusters, individualListings, zoom]);

  // Store last visible properties for retry mechanism
  useEffect(() => {
    lastVisiblePropertiesRef.current = visibleProperties;
  }, [visibleProperties]);

  // Track last callback time to avoid spam
  const lastCallbackTimeRef = useRef<number>(0);
  
  // Function to notify parent - extracted for reuse
  const notifyParent = useCallback((props: PropertyListing[]) => {
    const globalCallback = getGlobalCallback();
    const callback = globalCallback || contextCallback.onVisiblePropertiesChange || onVisiblePropertiesChange || onVisiblePropertiesChangeRef.current;
    
    if (callback && typeof callback === 'function') {
      console.log(`📤 [MapboxPropertyMap] Calling callback with ${props.length} visible properties`);
      try {
        callback(props);
        console.log(`✅ [MapboxPropertyMap] Successfully called callback with ${props.length} properties`);
        return true;
      } catch (error) {
        console.error('❌ [MapboxPropertyMap] Error calling onVisiblePropertiesChange:', error);
        return false;
      }
    }
    return false;
  }, [onVisiblePropertiesChange, contextCallback]);
  
  // Update last callback time when we successfully call
  const notifyParentWithTracking = useCallback((props: PropertyListing[]) => {
    const success = notifyParent(props);
    if (success) {
      lastCallbackTimeRef.current = Date.now();
    }
    return success;
  }, [notifyParent]);

  // Notify parent component when visible properties change
  useEffect(() => {
    console.log('🔔 [MapboxPropertyMap] visibleProperties changed:', {
      propertiesCount: visibleProperties.length,
      sampleProperties: visibleProperties.slice(0, 3).map(p => ({ mls: p.mlsNumber, address: p.address?.location || `${p.address?.streetNumber || ''} ${p.address?.streetName || ''}`.trim() })),
    });
    
    const success = notifyParentWithTracking(visibleProperties);
    
    if (!success) {
      console.warn('⚠️ [MapboxPropertyMap] Callback not available, will retry in 500ms...', {
        propertiesCount: visibleProperties.length,
      });
      
      // Retry after a short delay in case callback gets set later
      const retryTimeout = setTimeout(() => {
        const retrySuccess = notifyParentWithTracking(visibleProperties);
        if (!retrySuccess) {
          console.warn('⚠️ [MapboxPropertyMap] Retry failed - callback still not available');
        }
      }, 500);
      return () => clearTimeout(retryTimeout);
    }
  }, [visibleProperties, notifyParentWithTracking]);
  
  // Periodic check to ensure callback is called (fallback mechanism)
  useEffect(() => {
    if (visibleProperties.length === 0) return;
    
    const interval = setInterval(() => {
      const globalCallback = getGlobalCallback();
      if (globalCallback && typeof globalCallback === 'function' && lastVisiblePropertiesRef.current.length > 0) {
        // Only call if we haven't called recently (avoid spam)
        const timeSinceLastCall = Date.now() - lastCallbackTimeRef.current;
        if (timeSinceLastCall > 2000) { // Only if last call was more than 2 seconds ago
          console.log('🔄 [MapboxPropertyMap] Periodic check: Calling callback with', lastVisiblePropertiesRef.current.length, 'properties');
          try {
            globalCallback(lastVisiblePropertiesRef.current);
            lastCallbackTimeRef.current = Date.now();
          } catch (error) {
            console.error('❌ [MapboxPropertyMap] Periodic check error:', error);
          }
        }
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [visibleProperties.length]);

  // Convert filtered clusters and individual listings to GeoJSON for Mapbox
  const clustersGeoJSON = useMemo(() => {
    const features: Array<{
      type: 'Feature';
      id: string;
      properties: {
        clusterId?: number;
        count?: number;
        priceText: string;
        isSingleListing: boolean;
        listing?: PropertyListing | null;
        listings?: unknown;
        mlsNumber?: string; // For individual listings lookup
        listingData?: string; // JSON string of listing data for Mapbox compatibility
      };
      geometry: {
        type: 'Point';
        coordinates: [number, number];
      };
    }> = [];

      // Add cluster features ONLY when below threshold (strictly less than)
      // This ensures clusters are completely hidden before property tags appear
      if (zoom < MAX_ZOOM_FOR_CLUSTERS) {
        visibleClusters.forEach((cluster, index) => {
          const isSingleListing = !!(cluster.count === 1 && cluster.listing);
          const price = isSingleListing && cluster.listing?.listPrice
            ? typeof cluster.listing.listPrice === 'string'
              ? parseFloat(cluster.listing.listPrice)
              : cluster.listing.listPrice
            : 0;

          features.push({
            type: 'Feature',
            id: `cluster-${index}`,
            properties: {
              clusterId: index,
              count: cluster.count,
              priceText: isSingleListing && price > 0 
                ? `$${(price / 1000).toFixed(0)}K`
                : cluster.count >= 1000 
                  ? `${(cluster.count / 1000).toFixed(0)}K`
                  : cluster.count.toString(),
            isSingleListing,
            listing: isSingleListing && cluster.listing ? (cluster.listing as unknown as PropertyListing) : null,
            listings: cluster.listings || null,
          },
          geometry: {
            type: 'Point',
            coordinates: [cluster.location.longitude, cluster.location.latitude]
          }
        });
      });
    }

    // Add individual listing features ONLY when at or above threshold (strictly >=)
    // This ensures property tags only show when clusters are completely hidden
    if (zoom >= MAX_ZOOM_FOR_CLUSTERS) {
      individualListings.forEach((listing, index) => {
        if (!listing.map?.latitude || !listing.map?.longitude) return;
        
        const price = listing.listPrice || 0;
        const priceText = price > 0 ? `$${(price / 1000).toFixed(0)}K` : '$0K';

        features.push({
          type: 'Feature',
          id: `listing-${listing.mlsNumber || index}`,
          properties: {
            priceText,
            isSingleListing: true,
            mlsNumber: listing.mlsNumber, // Store MLS number for lookup
            // Store listing data as JSON string for Mapbox compatibility
            listingData: JSON.stringify({
              mlsNumber: listing.mlsNumber,
              listPrice: listing.listPrice,
              type: listing.type,
              address: listing.address,
              details: listing.details,
              images: listing.images
            })
          },
          geometry: {
            type: 'Point',
            coordinates: [listing.map.longitude, listing.map.latitude]
          }
        });
      });
      
      console.log(`🏠 [MapboxPropertyMap] Added ${features.length} individual listing features at zoom ${zoom}`);
    }

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [visibleClusters, individualListings, zoom]);

  // Create cluster marker image
  const createClusterImage = useCallback((count: number, map: mapboxgl.Map): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const cacheKey = `cluster-${count}`;
      
      // Calculate size based on count - make circles smaller
      const size = count < 10 ? 32 : count < 100 ? 40 : 48;
      const fontSize = count < 10 ? '11px' : count < 100 ? '13px' : '15px';
      const displayCount = count >= 1000 ? `${(count / 1000).toFixed(0)}K` : count.toString();
      
      // Center text exactly in the middle of the circle
      // Use dominant-baseline="middle" and text-anchor="middle" for perfect centering
      const centerX = size / 2;
      const centerY = size / 2;
      
      const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${centerX}" cy="${centerY}" r="${size/2 - 2}" fill="#1AC0EB" stroke="white" stroke-width="2"/>
          <text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif">${displayCount}</text>
        </svg>
      `;

      const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxQUMwRUIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==';
      };
      img.src = dataUrl;
    });
  }, []);

  // Format price text for display
  const formatPriceText = useCallback((listing: PropertyListing): string => {
    const price = listing.listPrice || 0;
    if (price > 0) {
      return listing.type === 'Lease' 
        ? `$${(price / 1000).toFixed(0)}K/mo`
        : `$${(price / 1000).toFixed(0)}K`;
    }
    return '$0K';
  }, []);

  // Show popup for a property listing
  const showPropertyPopup = useCallback((property: PropertyListing) => {
    if (!mapRef.current || !property.mlsNumber) return;

    const map = mapRef.current.getMap();
    
    // Close any existing popup
    if (popupRef.current) {
      popupRef.current.remove();
    }
    
    if (!property.map?.latitude || !property.map?.longitude) return;
    const coordinates: [number, number] = [property.map.longitude, property.map.latitude];
    
    // Create popup content with property information
    const currentPrice = property.listPrice || 0;
    const priceText = currentPrice > 0
      ? property.type === 'Lease' 
        ? `$${currentPrice.toLocaleString()}/mo`
        : `$${currentPrice.toLocaleString()}`
      : 'Price on request';
    
    // Calculate estimated market value (slightly higher than list price, or use list price if available)
    const estimatedMarketValue = currentPrice > 0 ? Math.round(currentPrice * 1.02) : 0;
    const estimatedMarketValueText = estimatedMarketValue > 0 ? `$${estimatedMarketValue.toLocaleString()}` : 'N/A';
    
    // Optional: previous price (if we had price history, we'd use that)
    // For now, we'll show a hypothetical previous price if current price is high enough
    const previousPrice = currentPrice > 400000 ? Math.round(currentPrice * 0.7) : null;
    const previousPriceText = previousPrice ? `$${previousPrice.toLocaleString()}` : '';
    
    const bedrooms = property.details?.numBedrooms || 0;
    const bathrooms = property.details?.numBathrooms || 0;
    const sqft = typeof property.details?.sqft === 'number' 
      ? property.details.sqft 
      : typeof property.details?.sqft === 'string' 
        ? parseInt(property.details.sqft.replace(/,/g, '')) || 0 
        : 0;
    
    const addressParts = [
      property.address?.streetNumber,
      property.address?.streetName,
      property.address?.streetSuffix
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0
      ? `${addressParts.join(' ')}, ${property.address?.city || ''}${property.address?.state ? `, ${property.address.state}` : ''}${property.address?.zip ? ` ${property.address.zip}` : ''}`
      : property.address?.location || 'Address not available';
    
    // Create popup content with property information using Tailwind classes
    const popupContent = document.createElement('div');
    popupContent.className = 'property-popup-content bg-white rounded-xl shadow-xl overflow-hidden max-w-[280px] relative';
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text: string | number | null | undefined): string => {
      if (text === null || text === undefined) return '';
      const str = String(text);
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    const imageUrl = property.images?.imageUrl || '/images/p1.jpg';
    const escapedAddress = escapeHtml(fullAddress);
    
    // SVG icons for features (smaller size)
    const bedIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 12h18"/><path d="M6 8V4"/><path d="M6 4h12"/><path d="M18 8V4"/></svg>`;
    const bathIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6 5l-3 3v2l3-1 3 1v-2z"/><path d="M5 22v-5h14v5"/><path d="M19 10v-2a2 2 0 0 0-2-2h-1"/><path d="M5 10V8a2 2 0 0 1 2-2h1"/><path d="M9 8h6"/><path d="M9 12h6"/></svg>`;
    const sqftIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`;
    const locationIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const infoIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    const trendUpIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`;
    
    popupContent.innerHTML = `
      <div class="p-0">
        <!-- Image -->
        <img 
          src="${imageUrl}" 
          alt="Property"
          class="w-full h-[140px] object-cover block rounded-t-xl"
          onerror="this.onerror=null; this.src='/images/p1.jpg';"
        />
        
        <!-- Content -->
        <div class="p-3 space-y-2.5">
          <!-- Price Section -->
          <div class="flex items-start justify-between gap-2">
            <div class="text-xl font-bold text-gray-900">
              ${escapeHtml(priceText)}
            </div>
            ${previousPriceText ? `
              <div class="text-xs text-gray-500 line-through pt-0.5">
                ${escapeHtml(previousPriceText)}
              </div>
            ` : ''}
          </div>
          
          <!-- Estimated Market Value Section -->
          ${estimatedMarketValue > 0 ? `
            <div class="bg-blue-50 rounded-lg p-2 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-gray-700">Estimated Market Value</span>
                <div class="w-3.5 h-3.5 rounded-full bg-blue-200 flex items-center justify-center">
                  <div class="text-[9px] text-blue-600 font-bold">i</div>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <div class="text-blue-600">${trendUpIcon}</div>
                <span class="text-xs font-bold text-blue-600">${escapeHtml(estimatedMarketValueText)}</span>
              </div>
            </div>
          ` : ''}
          
          <!-- Property Features -->
          <div class="flex items-center gap-3 text-gray-700">
            ${bedrooms > 0 ? `
              <div class="flex items-center gap-1">
                <div class="text-gray-700">${bedIcon}</div>
                <span class="text-xs"><span class="font-bold">${bedrooms}</span> bed${bedrooms !== 1 ? 's' : ''}</span>
              </div>
            ` : ''}
            ${bathrooms > 0 ? `
              <div class="flex items-center gap-1">
                <div class="text-gray-700">${bathIcon}</div>
                <span class="text-xs"><span class="font-bold">${bathrooms}</span> bath${bathrooms !== 1 ? 's' : ''}</span>
              </div>
            ` : ''}
            ${sqft > 0 ? `
              <div class="flex items-center gap-1">
                <div class="text-gray-700">${sqftIcon}</div>
                <span class="text-xs"><span class="font-bold">${sqft.toLocaleString()}</span> sqft</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Address Section -->
          <div class="flex items-start gap-1.5 text-gray-700">
            <div class="text-gray-700 mt-0.5 flex-shrink-0">${locationIcon}</div>
            <span class="text-xs">${escapedAddress}</span>
          </div>
        </div>
      </div>
    `;
    
    // Add click handler for the button
    const button = popupContent.querySelector(`#popup-view-details-${property.mlsNumber}`) as HTMLButtonElement;
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(getPropertyUrl(property), '_blank');
      });
    }
    
    // Create and show popup
    popupRef.current = new mapboxgl.Popup({ 
      closeOnClick: true,
      closeButton: true,
      maxWidth: '280px',
      className: 'property-popup'
    })
      .setLngLat(coordinates)
      .setDOMContent(popupContent)
      .addTo(map);
    
    // Also call onPropertySelect for consistency
    onPropertySelect(property);
  }, [onPropertySelect]);

  // Update map with clusters
  useEffect(() => {
    if (!mapRef.current || !sourceLoadedRef.current) return;

    const map = mapRef.current.getMap();
    const source = map.getSource('clusters') as GeoJSONSource | null;
    
    if (source) {
      source.setData(clustersGeoJSON);
      
      // Load marker images for clusters and single listings
      const loadImages = async () => {
        const uniqueCounts = new Set<number>();
        const uniquePrices = new Set<string>();
        
        // Process clusters (when not at max zoom)
        clusters.forEach(cluster => {
          if (cluster.count === 1 && cluster.listing?.listPrice) {
            const price = typeof cluster.listing.listPrice === 'string'
              ? parseFloat(cluster.listing.listPrice)
              : cluster.listing.listPrice;
            if (price > 0) {
              uniquePrices.add(`$${(price / 1000).toFixed(0)}K`);
            }
          } else {
            uniqueCounts.add(cluster.count);
          }
        });

        // Process individual listings (when at max zoom)
        individualListings.forEach(listing => {
          const price = listing.listPrice || 0;
          if (price > 0) {
            uniquePrices.add(`$${(price / 1000).toFixed(0)}K`);
          }
        });

        const loadPromises: Promise<void>[] = [];
        
        // Load cluster images
        uniqueCounts.forEach(count => {
          const imageId = `cluster-${count}`;
          if (!map.hasImage(imageId)) {
            loadPromises.push(
              createClusterImage(count, map).then(img => {
                map.addImage(imageId, img);
              })
            );
          }
        });

        // Note: Individual listings are now rendered as Marker components with Tailwind, not as symbol layer images
        
        console.log(`🖼️ [MapboxPropertyMap] Loading ${loadPromises.length} marker images (${uniqueCounts.size} clusters)`);

        await Promise.all(loadPromises);
      };

      loadImages().catch(console.error);
    }
  }, [clustersGeoJSON, visibleClusters, clusters, createClusterImage]);

  // Update layer visibility based on zoom level to ensure clusters are hidden when showing property tags
  useEffect(() => {
    if (!mapRef.current || !sourceLoadedRef.current) return;

    const map = mapRef.current.getMap();
    const currentZoom = map.getZoom();

    // Strict threshold: clusters below threshold, property tags at or above threshold
    if (currentZoom < MAX_ZOOM_FOR_CLUSTERS) {
      // Show clusters, hide property tags
      if (map.getLayer('cluster-markers')) {
        map.setLayoutProperty('cluster-markers', 'visibility', 'visible');
      }
      if (map.getLayer('single-listings')) {
        map.setLayoutProperty('single-listings', 'visibility', 'none');
      }
      console.log(`👁️ [MapboxPropertyMap] Showing clusters (zoom ${currentZoom.toFixed(2)} < ${MAX_ZOOM_FOR_CLUSTERS})`);
    } else {
      // Hide clusters, show property tags (both layer and React Marker components)
      if (map.getLayer('cluster-markers')) {
        map.setLayoutProperty('cluster-markers', 'visibility', 'none');
      }
      if (map.getLayer('single-listings')) {
        map.setLayoutProperty('single-listings', 'visibility', 'visible');
      }
      console.log(`👁️ [MapboxPropertyMap] Hiding clusters, showing property tags (zoom ${currentZoom.toFixed(2)} >= ${MAX_ZOOM_FOR_CLUSTERS})`);
    }
  }, [zoom, clustersGeoJSON]);

  // Handle map load and setup
  const onMapLoad = useCallback(async () => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // Add GeoJSON source for clusters
    map.addSource('clusters', {
      type: 'geojson',
      generateId: true,
      data: clustersGeoJSON,
    });

    // Add cluster markers as icons (circle + text as one unit) with collision detection
    // This ensures entire markers don't overlap, keeping them properly organized
    // Only show clusters when zoom is below threshold
    map.addLayer({
      id: 'cluster-markers',
      type: 'symbol',
      source: 'clusters',
      filter: ['all', ['!', ['get', 'isSingleListing']]], // Only show actual clusters, not single listings
      layout: {
        'icon-image': ['concat', 'cluster-', ['get', 'count']],
        'icon-size': 1,
        // Enable collision detection to prevent overlapping markers
        'icon-allow-overlap': false,
        'icon-ignore-placement': false,
        // Add padding around icons to ensure proper spacing
        'icon-padding': 2,
        // Anchor icon at center
        'icon-anchor': 'center'
      }
    });

    // Add single listing markers (price tags) - only show when at max zoom threshold
    // This layer will be hidden/shown based on zoom level
    map.addLayer({
      id: 'single-listings',
      type: 'symbol',
      source: 'clusters',
      filter: ['get', 'isSingleListing'], // Only show single listings (property tags)
      layout: {
        'icon-image': ['concat', 'listing-', ['get', 'priceText']],
        'icon-size': 1,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center'
      }
    });
    
    // Set initial layer visibility based on current zoom
    const initialZoom = map.getZoom();
    if (initialZoom < MAX_ZOOM_FOR_CLUSTERS) {
      // Show clusters, hide property tags
      map.setLayoutProperty('single-listings', 'visibility', 'none');
      console.log(`✅ [MapboxPropertyMap] Initial state: Showing clusters, hiding property tags (zoom ${initialZoom.toFixed(2)} < ${MAX_ZOOM_FOR_CLUSTERS})`);
    } else {
      // Hide clusters, show property tags
      map.setLayoutProperty('cluster-markers', 'visibility', 'none');
      map.setLayoutProperty('single-listings', 'visibility', 'visible');
      console.log(`✅ [MapboxPropertyMap] Initial state: Hiding clusters, showing property tags (zoom ${initialZoom.toFixed(2)} >= ${MAX_ZOOM_FOR_CLUSTERS})`);
    }

    // Handle cluster clicks - zoom in and fetch new clusters
    map.on('click', 'cluster-markers', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['cluster-markers']
      });
      if (features.length === 0) return;
      
      const feature = features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      
      // Zoom in by 2 levels
      const currentZoom = map.getZoom();
      const newZoom = Math.min(currentZoom + 2, 20);
      
      map.easeTo({
        center: coordinates,
        zoom: newZoom,
        duration: 500
      });
      
      // After zoom animation completes, fetch new clusters with higher precision
      // This ensures clusters break down into smaller, more granular clusters
      setTimeout(() => {
        const mapBounds = map.getBounds();
        if (mapBounds) {
          const ne = mapBounds.getNorthEast();
          const sw = mapBounds.getSouthWest();
          const bounds: MapBounds = {
            north: ne.lat,
            south: sw.lat,
            east: ne.lng,
            west: sw.lng
          };
          // Fetch with new zoom level for higher precision clustering
          fetchClusters(bounds, newZoom);
          setCurrentBounds(bounds);
        }
      }, 550); // Wait for zoom animation to complete (500ms + 50ms buffer)
    });

    // Note: Individual listing clicks are now handled by Marker component onClick handlers

    // Close popup when clicking on map (but not on markers)
    map.on('click', (e) => {
      // Check if click was on a marker layer
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['cluster-markers']
      });
      
      // Only close popup if clicking on empty map area
      if (features.length === 0 && popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
        onPropertySelect(null);
      }
    });

    // Cursor changes
    map.on('mouseenter', 'cluster-markers', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'cluster-markers', () => {
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

    // Fetch initial clusters
    const mapBounds = map.getBounds();
    if (mapBounds) {
      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      const bounds: MapBounds = {
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng
      };
      setCurrentBounds(bounds); // Set initial bounds for filtering
      fetchClusters(bounds, map.getZoom());
      onBoundsChange(bounds);
    }
  }, [initialCenter, initialZoom, locationCenter, onBoundsChange, fetchClusters, properties, onPropertySelect, clustersGeoJSON]);

  // Handle map move/zoom - fetch new clusters
  // Note: During zoom, we skip fetching here and let zoomend handle it
  const onMove = useCallback(() => {
    if (!mapRef.current || isProgrammaticUpdateRef.current || isZoomingRef.current) return;

    const map = mapRef.current.getMap();
    const mapBounds = map.getBounds();
    const currentZoom = map.getZoom();

    setZoom(currentZoom);

    if (mapBounds) {
      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      const bounds: MapBounds = {
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng
      };

      // Throttle bounds change callback
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
      
      boundsChangeTimeoutRef.current = setTimeout(() => {
        onBoundsChange(bounds);
        setCurrentBounds(bounds); // Update bounds for filtering
        // Only fetch if not zooming (zoomend will handle zoom-based fetches)
        if (!isZoomingRef.current) {
          fetchClusters(bounds, currentZoom);
        }
      }, 150);
    }
  }, [onBoundsChange, fetchClusters]);

  // Handle user interaction start/end and fetch clusters on zoom end
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    
    const handleZoomStart = () => {
      isZoomingRef.current = true;
      disableRequests();
    };
    
    const handleZoomEnd = () => {
      // Clear flags immediately
      isZoomingRef.current = false;
      isUserInteractingRef.current = false;
      enableRequests();
      
      // Fetch new clusters with updated zoom level - this reorganizes clusters
      const mapBounds = map.getBounds();
      const currentZoom = map.getZoom();
      
      if (mapBounds) {
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        const bounds: MapBounds = {
          north: ne.lat,
          south: sw.lat,
          east: ne.lng,
          west: sw.lng
        };
        setCurrentBounds(bounds);
        setZoom(currentZoom);
        
        // Force fetch with new zoom level - this will reclassify clusters at new precision
        // The precision calculation uses currentZoom, so clusters will reorganize
        console.log('🔄 [MapboxPropertyMap] Zoom ended, fetching clusters with new zoom:', currentZoom);
        
        // Clear any pending fetches and fetch immediately with new zoom
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchClusters(bounds, currentZoom);
      }
    };
    
    map.on('dragstart', disableRequests);
    map.on('zoomstart', handleZoomStart);
    map.on('dragend', enableRequests);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('dragstart', disableRequests);
      map.off('zoomstart', handleZoomStart);
      map.off('dragend', enableRequests);
      map.off('zoomend', handleZoomEnd);
    };
  }, [disableRequests, enableRequests, fetchClusters]);

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

  // Resize map when container size changes
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeTimeout: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          if (mapRef.current) {
            const map = mapRef.current.getMap();
            try {
              map.resize();
            } catch (error) {
              console.warn('Map resize error:', error);
            }
          }
        });
      }, 150);
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

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
      {/* Filter Panel */}
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

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 px-4 py-2 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-700">Loading properties...</span>
          </div>
        </div>
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
        interactiveLayerIds={['cluster-markers']}
      >
        {/* Individual listing markers (property tags) - only show when zoom >= MAX_ZOOM_FOR_CLUSTERS */}
        {zoom >= MAX_ZOOM_FOR_CLUSTERS && individualListings.map((listing) => {
          if (!listing.map?.latitude || !listing.map?.longitude) return null;
          
          const priceText = formatPriceText(listing);
          
          return (
            <Marker
              key={listing.mlsNumber}
              longitude={listing.map.longitude}
              latitude={listing.map.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent?.stopPropagation();
                showPropertyPopup(listing);
              }}
            >
              <div className="bg-white text-black px-4 py-1.5 rounded-full shadow-md font-bold text-xs cursor-pointer hover:shadow-lg transition-shadow whitespace-nowrap">
                {priceText}
              </div>
            </Marker>
          );
        })}
      </MapboxMap>
    </div>
  );
};

export default MapboxPropertyMap;
