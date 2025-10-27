"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Maximize2, Minimize2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MapProps {
  // Location data
  latitude?: number;
  longitude?: number;
  address?: string;
  
  // Map configuration
  height?: string;
  width?: string;
  zoom?: number;
  mapType?: "roadmap" | "satellite" | "hybrid" | "terrain";
  
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
  
  // Custom marker
  markerTitle?: string;
  markerDescription?: string;
}

const Map: React.FC<MapProps> = ({
  latitude,
  longitude,
  address,
  height = "400px",
  width = "100%",
  zoom = 15,
  mapType = "roadmap",
  showControls = true,
  showFullscreen = true,
  showExternalLink = true,
  showMarker = true,
  className = "",
  borderRadius = "lg",
  loading = false,
  markerTitle,
  markerDescription,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Generate map query
  const getMapQuery = () => {
    if (latitude && longitude) {
      return `&center=${latitude},${longitude}&q=${latitude},${longitude}`;
    }
    
    if (address) {
      return `&q=${encodeURIComponent(address)}`;
    }
    
    return "&q=Location";
  };

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

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle map load
  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Map container styles
  const mapContainerStyle = {
    height: isFullscreen ? "100vh" : height,
    width: isFullscreen ? "100vw" : width,
    borderRadius: isFullscreen ? "0" : borderRadius,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className={`relative overflow-hidden bg-muted border border-border/50 ${
          isFullscreen ? "fixed inset-0 z-50" : ""
        }`}
        style={mapContainerStyle}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        {!mapLoaded && !loading && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Map View</p>
            </div>
          </div>
        )}

        {/* Google Maps Embed */}
        <iframe
          className="w-full h-full"
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyB0KWOeJWvvAoo5pbLcqYTnqhCv1mp3X5U${getMapQuery()}&zoom=${zoom}&maptype=${mapType}`}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={handleMapLoad}
          style={{ borderRadius: isFullscreen ? "0" : borderRadius }}
        />

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

        {/* Location Info Card */}
        {(address || (latitude && longitude)) && (
          <div className="absolute bottom-4 left-4 z-20">
            <Card className="bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    {address ? (
                      <p className="font-medium text-foreground">{address}</p>
                    ) : (
                      <p className="font-medium text-foreground">
                        {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                      </p>
                    )}
                    {markerTitle && (
                      <p className="text-xs text-muted-foreground">{markerTitle}</p>
                    )}
                    {markerDescription && (
                      <p className="text-xs text-muted-foreground">{markerDescription}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Button */}
        {showMarker && (latitude && longitude) && (
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
                      // Fallback to general directions
                      const directionsUrl = `https://www.google.com/maps/dir//${latitude},${longitude}`;
                      window.open(directionsUrl, "_blank");
                    }
                  );
                } else {
                  // Fallback to general directions
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

      {/* Map Type Selector */}
      {showControls && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-1">
            {(["roadmap", "satellite", "hybrid", "terrain"] as const).map((type) => (
              <Button
                key={type}
                variant={mapType === type ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  // This would require re-rendering the iframe with new mapType
                  // For now, we'll just show the current selection
                }}
                className="h-7 px-2 text-xs capitalize"
                disabled
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
