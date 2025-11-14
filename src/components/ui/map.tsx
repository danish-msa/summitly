"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { Navigation, Maximize2, Minimize2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PropertyListing } from "@/lib/types";
import { getListings } from "@/lib/api/repliers/services/listings";
import { getPropertyUrl } from "@/lib/utils/propertyUrl";

interface MapProps {
  // Location data
  latitude?: number;
  longitude?: number;
  address?: string;
  
  // Map configuration
  height?: string;
  width?: string;
  zoom?: number;
  
  // UI options
  showControls?: boolean;
  showFullscreen?: boolean;
  showExternalLink?: boolean;
  showMarker?: boolean;
  
  // Styling
  className?: string;
  borderRadius?: string;
  
  // Loading state
  loading?: boolean;
  
  // Current property (to highlight it)
  currentProperty?: PropertyListing;
}

// Map container styles
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Map options
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const Map: React.FC<MapProps> = ({
  latitude,
  longitude,
  address,
  height = "400px",
  width = "100%",
  zoom = 15,
  showControls = true,
  showFullscreen = true,
  showExternalLink = true,
  showMarker = true,
  className = "",
  borderRadius = "lg",
  loading = false,
  currentProperty,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [nearbyListings, setNearbyListings] = useState<PropertyListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const router = useRouter();

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Simple collision detection - filter out listings that are too close together
  const filterOverlappingListings = (listings: PropertyListing[], minDistance: number = 0.001): PropertyListing[] => {
    const filtered: PropertyListing[] = [];
    const used: Set<string> = new Set();
    
    // Sort by price (highest first) to prioritize more expensive listings
    const sorted = [...listings].sort((a, b) => (b.listPrice || 0) - (a.listPrice || 0));
    
    for (const listing of sorted) {
      if (!listing.map.latitude || !listing.map.longitude) continue;
      
      let tooClose = false;
      const key = `${listing.map.latitude.toFixed(4)}_${listing.map.longitude.toFixed(4)}`;
      
      // Check if this position is already used
      if (used.has(key)) continue;
      
      // Check distance to already filtered listings
      for (const existing of filtered) {
        if (!existing.map.latitude || !existing.map.longitude) continue;
        
        const distance = calculateDistance(
          listing.map.latitude,
          listing.map.longitude,
          existing.map.latitude,
          existing.map.longitude
        );
        
        // If too close, skip this listing
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        filtered.push(listing);
        used.add(key);
      }
    }
    
    return filtered;
  };

  // Fetch nearby listings
  const fetchNearbyListings = useCallback(async (centerLat: number, centerLng: number, currentZoom: number = zoom) => {
    if (!centerLat || !centerLng) return;
    
    setIsLoadingListings(true);
    try {
      // Adjust radius based on zoom level
      const radius = currentZoom >= 16 ? 0.02 : currentZoom >= 14 ? 0.05 : 0.1; // Smaller radius for higher zoom
      const maxResults = currentZoom >= 16 ? 30 : currentZoom >= 14 ? 50 : 100;
      
      const params = {
        resultsPerPage: maxResults,
        status: 'A',
      };

      const result = await getListings(params);
      
      if (result.listings) {
        // Filter listings within reasonable distance of the center
        let filtered = result.listings.filter(listing => {
          if (!listing.map.latitude || !listing.map.longitude) return false;
          
          const distance = calculateDistance(
            centerLat,
            centerLng,
            listing.map.latitude,
            listing.map.longitude
          );
          
          // Filter by distance (within ~5-10km depending on zoom)
          return distance < (radius * 100); // Convert to km
        });
        
        // Remove overlapping listings
        filtered = filterOverlappingListings(filtered);
        
        // Limit total number to prevent clutter
        setNearbyListings(filtered.slice(0, maxResults));
      }
    } catch (error) {
      console.error("Error fetching nearby listings:", error);
      setNearbyListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [zoom]);

  // Fetch listings when map loads or center changes
  useEffect(() => {
    if (mapLoaded && latitude && longitude && mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || zoom;
      fetchNearbyListings(latitude, longitude, currentZoom);
    }
  }, [mapLoaded, latitude, longitude, fetchNearbyListings, zoom]);

  // Refetch listings when zoom changes
  useEffect(() => {
    if (mapLoaded && mapRef.current && latitude && longitude) {
      const listener = mapRef.current.addListener('zoom_changed', () => {
        const currentZoom = mapRef.current?.getZoom() || zoom;
        fetchNearbyListings(latitude, longitude, currentZoom);
      });
      
      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    }
  }, [mapLoaded, latitude, longitude, fetchNearbyListings, zoom]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.getDiv().requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Generate Google Maps URL for external link
  const getGoogleMapsUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    
    return "https://www.google.com/maps";
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    if (!price || price === 0) return 'N/A';
    
    if (price >= 1000000) {
      const millions = price / 1000000;
      // Round to 1 decimal place, but show without decimal if it's whole
      if (millions % 1 === 0) {
        return `$${Math.round(millions)}M`;
      }
      return `$${millions.toFixed(1)}M`;
    } else if (price >= 1000) {
      const thousands = price / 1000;
      // Round to nearest whole number for K
      return `$${Math.round(thousands)}K`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  };

  // Handle listing click
  const handleListingClick = (listing: PropertyListing) => {
    router.push(getPropertyUrl(listing));
  };

  // Map center
  const mapCenter = latitude && longitude 
    ? { lat: latitude, lng: longitude }
    : { lat: 43.6532, lng: -79.3832 }; // Default to Toronto

  // Map container styles
  const containerStyle = {
    height: isFullscreen ? "100vh" : height,
    width: isFullscreen ? "100vw" : width,
    borderRadius: isFullscreen ? "0" : borderRadius,
  };

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`} style={containerStyle}>
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        className={`relative overflow-hidden bg-muted border border-border/50 ${
          isFullscreen ? "fixed inset-0 z-50" : ""
        }`}
        style={containerStyle}
      >
        {/* Loading Overlay */}
        {(loading || isLoadingListings) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Google Map */}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={zoom}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Current Property Marker */}
          {showMarker && latitude && longitude && (
            <OverlayView
              position={{ lat: latitude, lng: longitude }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="relative">
                <div className="bg-green-600 w-fit text-white px-3 py-1.5 rounded-lg shadow-lg font-medium text-xs cursor-pointer hover:bg-green-700 transition-colors whitespace-nowrap">
                  {currentProperty?.listPrice ? formatPrice(currentProperty.listPrice) : 'Current'}
                </div>
              </div>
            </OverlayView>
          )}

          {/* Nearby Listings Price Tags */}
          {nearbyListings.map((listing) => {
            if (!listing.map.latitude || !listing.map.longitude) return null;
            
            // Skip if it's the current property (already shown above)
            if (currentProperty?.mlsNumber === listing.mlsNumber) return null;
            
            const isSelected = selectedListing?.mlsNumber === listing.mlsNumber;
            
            return (
              <OverlayView
                key={listing.mlsNumber}
                position={{ lat: listing.map.latitude, lng: listing.map.longitude }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  className={`relative group ${
                    isSelected ? 'z-20' : 'z-10'
                  }`}
                  style={{ 
                    transform: 'translate(-50%, -100%)',
                    pointerEvents: 'auto'
                  }}
                  onClick={() => handleListingClick(listing)}
                  onMouseEnter={() => setSelectedListing(listing)}
                  onMouseLeave={() => setSelectedListing(null)}
                  title={`${listing.details.propertyType} - ${listing.listPrice ? `$${listing.listPrice.toLocaleString()}` : ''}`}
                >
                  <div className={`bg-white text-gray-900 px-3 py-1.5 rounded-lg shadow-md font-semibold text-xs cursor-pointer hover:shadow-lg transition-all whitespace-nowrap ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                  }`}>
                    {listing.listPrice ? formatPrice(listing.listPrice) : 'N/A'}
                  </div>
                  <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>

        {/* Map Controls Overlay */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {/* Fullscreen Toggle */}
            {showFullscreen && (
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleFullscreen}
                className="h-9 w-9 bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* External Link */}
            {showExternalLink && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
                className="h-9 w-9 bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50"
                title="Open in Google Maps"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Navigation Button */}
        {showMarker && latitude && longitude && (
          <div className="absolute bottom-4 right-4 z-20">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const userLat = position.coords.latitude;
                      const userLng = position.coords.longitude;
                      const directionsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${latitude},${longitude}`;
                      window.open(directionsUrl, "_blank");
                    },
                    (error) => {
                      console.error("Error getting location:", error);
                      const directionsUrl = `https://www.google.com/maps/dir//${latitude},${longitude}`;
                      window.open(directionsUrl, "_blank");
                    }
                  );
                } else {
                  const directionsUrl = `https://www.google.com/maps/dir//${latitude},${longitude}`;
                  window.open(directionsUrl, "_blank");
                }
              }}
              className="h-9 w-9 bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50"
              title="Get directions"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
